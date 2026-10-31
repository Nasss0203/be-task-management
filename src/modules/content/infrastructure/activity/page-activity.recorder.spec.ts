import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import type { ActivityRepository } from 'src/modules/activity/domain/repositories/activity.repository';
import {
  ActivityPageActivityRecorder,
  PAGE_EDIT_WINDOW_MS,
} from './page-activity.recorder';

describe('ActivityPageActivityRecorder (kế hoạch ghi activity)', () => {
  const context = { transaction: 'tx' };
  let recordPageEdit: jest.Mock;
  let recorder: ActivityPageActivityRecorder;

  beforeEach(() => {
    recordPageEdit = jest.fn(() => Promise.resolve());
    recorder = new ActivityPageActivityRecorder({
      recordPageEdit,
    } as unknown as ActivityRepository);
  });

  it('records a block edit on the block, with only the Page id in metadata', async () => {
    await recorder.record(
      {
        actorId: 'user-1',
        pageId: 'page-1',
        blockId: 'block-1',
        action: 'PAGE_BLOCK_UPDATED',
      },
      context,
    );
    expect(recordPageEdit).toHaveBeenCalledWith(
      {
        actorId: 'user-1',
        pageId: 'page-1',
        entityType: ActivityEntityType.PAGE_BLOCK,
        entityId: 'block-1',
        action: ActivityAction.PAGE_BLOCK_UPDATED,
        metadata: { pageId: 'page-1' },
      },
      PAGE_EDIT_WINDOW_MS,
      context,
    );
    expect(PAGE_EDIT_WINDOW_MS).toBe(5 * 60 * 1000);
  });

  it('records a reorder on the Page id, and a restore as a created block', async () => {
    await recorder.record({
      actorId: 'u',
      pageId: 'p',
      action: 'PAGE_BLOCK_REORDERED',
    });
    await recorder.record({
      actorId: 'u',
      pageId: 'p',
      blockId: 'b',
      action: 'PAGE_BLOCK_CREATED',
      kind: 'RESTORED',
    });
    expect(recordPageEdit.mock.calls.map((call: unknown[]) => call[0])).toEqual(
      [
        expect.objectContaining({ entityId: 'p', metadata: { pageId: 'p' } }),
        expect.objectContaining({
          entityId: 'b',
          action: ActivityAction.PAGE_BLOCK_CREATED,
          metadata: { pageId: 'p', kind: 'RESTORED' },
        }),
      ],
    );
  });

  it('records a Page edit on the Page, with a kind only when there is one', async () => {
    await recorder.record({
      actorId: 'u',
      pageId: 'p',
      action: 'PAGE_UPDATED',
    });
    await recorder.record({
      actorId: 'u',
      pageId: 'p',
      action: 'PAGE_UPDATED',
      kind: 'MOVED',
    });
    expect(recordPageEdit.mock.calls.map((call: unknown[]) => call[0])).toEqual(
      [
        expect.objectContaining({
          entityType: ActivityEntityType.PAGE,
          entityId: 'p',
          metadata: null,
        }),
        expect.objectContaining({
          entityType: ActivityEntityType.PAGE,
          entityId: 'p',
          metadata: { kind: 'MOVED' },
        }),
      ],
    );
  });

  it.each([undefined, null, ''])(
    'records nothing without an actor (%p)',
    async (actorId) => {
      await recorder.record({
        actorId,
        pageId: 'p',
        action: 'PAGE_BLOCK_UPDATED',
      });
      expect(recordPageEdit).not.toHaveBeenCalled();
    },
  );
});
