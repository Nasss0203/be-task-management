import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import type { ActivityRepository } from 'src/modules/activity/domain/repositories/activity.repository';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import {
  ActivityDatabaseActivityRecorder,
  DATABASE_ROW_EDIT_WINDOW_MS,
} from './database-activity.recorder';

describe('ActivityDatabaseActivityRecorder', () => {
  const context = { transaction: 'tx' };
  let recordOnPage: jest.Mock;
  let findPageId: jest.Mock;
  let recorder: ActivityDatabaseActivityRecorder;

  beforeEach(() => {
    recordOnPage = jest.fn(() => Promise.resolve());
    findPageId = jest.fn(() => Promise.resolve('page-1'));
    recorder = new ActivityDatabaseActivityRecorder(
      { recordOnPage } as unknown as ActivityRepository,
      { findPageId } as unknown as DatabaseRepository,
    );
  });

  it('records a value edit on the row, merged, with the property as field and no value', async () => {
    await recorder.record(
      {
        actorId: 'user-1',
        databaseId: 'db-1',
        action: 'DATABASE_ROW_UPDATED',
        rowId: 'row-1',
        field: 'prop-1',
      },
      context,
    );

    expect(findPageId).toHaveBeenCalledWith('db-1', context);
    expect(recordOnPage).toHaveBeenCalledWith(
      {
        actorId: 'user-1',
        pageId: 'page-1',
        entityType: ActivityEntityType.DATABASE_ROW,
        entityId: 'row-1',
        action: ActivityAction.DATABASE_ROW_UPDATED,
        field: 'prop-1',
        metadata: { databaseId: 'db-1' },
      },
      DATABASE_ROW_EDIT_WINDOW_MS,
      context,
    );
    expect(DATABASE_ROW_EDIT_WINDOW_MS).toBe(5 * 60 * 1000);
  });

  it('records schema changes on the database without merging', async () => {
    await recorder.record({
      actorId: 'u',
      databaseId: 'db',
      action: 'DATABASE_PROPERTY_UPDATED',
      propertyId: 'p',
      optionId: 'o',
      kind: 'OPTION_DELETED',
    });
    await recorder.record({
      actorId: 'u',
      databaseId: 'db',
      action: 'DATABASE_ROW_CREATED',
      rowId: 'r',
    });

    expect(recordOnPage.mock.calls).toEqual([
      [
        {
          actorId: 'u',
          pageId: 'page-1',
          entityType: ActivityEntityType.DATABASE,
          entityId: 'db',
          action: ActivityAction.DATABASE_PROPERTY_UPDATED,
          field: null,
          metadata: { propertyId: 'p', optionId: 'o', kind: 'OPTION_DELETED' },
        },
        null,
        undefined,
      ],
      [
        expect.objectContaining({
          entityType: ActivityEntityType.DATABASE_ROW,
          entityId: 'r',
          metadata: { databaseId: 'db' },
        }),
        null,
        undefined,
      ],
    ]);
  });

  it('never puts a pageId in metadata, so rows are not merged per Page', async () => {
    await recorder.record({
      actorId: 'u',
      databaseId: 'db',
      action: 'DATABASE_ROW_UPDATED',
      rowId: 'r',
      field: 'p',
    });
    const [input] = recordOnPage.mock.calls[0] as [
      { metadata: Record<string, unknown> },
    ];
    expect(input.metadata).not.toHaveProperty('pageId');
  });

  it.each([undefined, null, ''])(
    'records nothing without an actor (%p)',
    async (actorId) => {
      await recorder.record({
        actorId,
        databaseId: 'db',
        action: 'DATABASE_ROW_CREATED',
        rowId: 'r',
      });
      expect(findPageId).not.toHaveBeenCalled();
      expect(recordOnPage).not.toHaveBeenCalled();
    },
  );

  it('records nothing for a database that no longer exists', async () => {
    findPageId.mockResolvedValueOnce(null);
    await recorder.record({
      actorId: 'u',
      databaseId: 'gone',
      action: 'DATABASE_RENAMED',
    });
    expect(recordOnPage).not.toHaveBeenCalled();
  });
});
