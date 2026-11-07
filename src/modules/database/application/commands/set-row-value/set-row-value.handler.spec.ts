import { NotFoundException } from '@nestjs/common';

import { Database } from '../../../domain/aggregates/database/database.aggregate';
import { DatabaseRow } from '../../../domain/aggregates/row/database-row.aggregate';
import { SetRowValueCommand } from './set-row-value.command';
import { SetRowValueHandler } from './set-row-value.handler';

describe('SetRowValueHandler activity', () => {
  const context = { transaction: 'tx' };
  let row: DatabaseRow | null;
  const database = Database.create({
    id: 'db',
    pageId: 'page',
    name: 'Tasks',
    titlePropertyId: 'title',
    assigneePropertyId: 'assignee',
    dueDatePropertyId: 'due',
  });
  const databaseRepository = {
    findById: jest.fn(() => Promise.resolve(database)),
  };
  const rowRepository = {
    findById: jest.fn(() => Promise.resolve(row)),
    save: jest.fn(() => Promise.resolve()),
  };
  const recorder = { record: jest.fn(() => Promise.resolve()) };
  const handler = new SetRowValueHandler(
    databaseRepository as never,
    rowRepository as never,
    recorder as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    row = DatabaseRow.create({ id: 'row', databaseId: 'db' });
  });

  it('records the edited property and its new value after saving, in the same context', async () => {
    await handler.execute(
      new SetRowValueCommand('row', 'title', 'Launch plan', 'user-1'),
      context,
    );

    expect(rowRepository.save).toHaveBeenCalledWith(row, context);
    expect(recorder.record).toHaveBeenCalledWith(
      {
        actorId: 'user-1',
        databaseId: 'db',
        action: 'DATABASE_ROW_UPDATED',
        rowId: 'row',
        field: 'title',
        newValue: 'Launch plan',
      },
      context,
    );
  });

  it('passes no actor for system writes, so the recorder skips them', async () => {
    await handler.execute(
      new SetRowValueCommand('row', 'title', 'From a form'),
    );

    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: null }),
      undefined,
    );
  });

  it('records nothing when the row is missing or the save fails', async () => {
    row = null;
    await expect(
      handler.execute(new SetRowValueCommand('row', 'title', 'x', 'user-1')),
    ).rejects.toBeInstanceOf(NotFoundException);

    row = DatabaseRow.create({ id: 'row', databaseId: 'db' });
    rowRepository.save.mockRejectedValueOnce(new Error('write failed'));
    await expect(
      handler.execute(new SetRowValueCommand('row', 'title', 'x', 'user-1')),
    ).rejects.toThrow('write failed');

    expect(recorder.record).not.toHaveBeenCalled();
  });
});
