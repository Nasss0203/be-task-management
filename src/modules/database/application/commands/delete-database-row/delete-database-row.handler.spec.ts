import { NotFoundException } from '@nestjs/common';

import { DatabaseRow } from '../../../domain/aggregates/row/database-row.aggregate';
import { DeleteDatabaseRowCommand } from './delete-database-row.command';
import { DeleteDatabaseRowHandler } from './delete-database-row.handler';

describe('DeleteDatabaseRowHandler', () => {
  let row: DatabaseRow | null;
  const rowRepository = {
    findById: jest.fn(() => Promise.resolve(row)),
    delete: jest.fn(() => Promise.resolve()),
  };
  const recorder = { record: jest.fn(() => Promise.resolve()) };
  const publisher = { publish: jest.fn() };
  const handler = new DeleteDatabaseRowHandler(
    rowRepository as never,
    recorder as never,
    publisher as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    row = DatabaseRow.create({ id: 'row', databaseId: 'db' });
  });

  it('announces the row change of its database after deleting the row', async () => {
    await handler.execute(new DeleteDatabaseRowCommand('row', 'user-1'));

    expect(rowRepository.delete).toHaveBeenCalledWith('row');
    expect(publisher.publish).toHaveBeenCalledWith('db');
  });

  it('announces nothing when the row is missing or the delete fails', async () => {
    row = null;
    await expect(
      handler.execute(new DeleteDatabaseRowCommand('row', 'user-1')),
    ).rejects.toBeInstanceOf(NotFoundException);

    row = DatabaseRow.create({ id: 'row', databaseId: 'db' });
    rowRepository.delete.mockRejectedValueOnce(new Error('write failed'));
    await expect(
      handler.execute(new DeleteDatabaseRowCommand('row', 'user-1')),
    ).rejects.toThrow('write failed');

    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
