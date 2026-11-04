import { BadRequestException, NotFoundException } from '@nestjs/common';

import { DatabaseRow } from '../../../domain/aggregates/row/database-row.aggregate';
import { ChangeDatabaseRowParentCommand } from './change-database-row-parent.command';
import { ChangeDatabaseRowParentHandler } from './change-database-row-parent.handler';

const row = (id: string, parentRowId: string | null = null) =>
  DatabaseRow.create({ id, databaseId: 'db', parentRowId });

describe('ChangeDatabaseRowParentHandler', () => {
  let rows: DatabaseRow[];
  const repository = {
    findById: jest.fn((id: string) =>
      Promise.resolve(rows.find((item) => item.getId() === id) ?? null),
    ),
    findByDatabaseId: jest.fn(() => Promise.resolve(rows)),
    save: jest.fn(),
  };
  const handler = new ChangeDatabaseRowParentHandler(repository as never);

  beforeEach(() => {
    jest.clearAllMocks();
    rows = [row('a'), row('b', 'a'), row('x')];
  });

  it('moves a row under another row of the same database', async () => {
    await expect(
      handler.execute(new ChangeDatabaseRowParentCommand('b', 'x')),
    ).resolves.toEqual({ id: 'b', parentRowId: 'x' });
    expect(repository.save).toHaveBeenCalledWith(rows[1]);
  });

  it('makes a row top-level without loading the tree', async () => {
    await expect(
      handler.execute(new ChangeDatabaseRowParentCommand('b', null)),
    ).resolves.toEqual({ id: 'b', parentRowId: null });
    expect(repository.findByDatabaseId).not.toHaveBeenCalled();
  });

  it('rejects a parent from another database and a cycle', async () => {
    await expect(
      handler.execute(new ChangeDatabaseRowParentCommand('a', 'other')),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      handler.execute(new ChangeDatabaseRowParentCommand('a', 'b')),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects a missing row', async () => {
    await expect(
      handler.execute(new ChangeDatabaseRowParentCommand('missing', null)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
