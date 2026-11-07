import { BadRequestException, NotFoundException } from '@nestjs/common';

import { Database } from '../../../domain/aggregates/database/database.aggregate';
import { RenameDatabaseCommand } from './rename-database.command';
import { RenameDatabaseHandler } from './rename-database.handler';

describe('RenameDatabaseHandler', () => {
  let database: Database | null;
  const repository = {
    findById: jest.fn(() => Promise.resolve(database)),
    save: jest.fn(),
  };
  const recorder = { record: jest.fn(() => Promise.resolve()) };
  const handler = new RenameDatabaseHandler(
    repository as never,
    recorder as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    database = Database.create({
      id: 'db',
      pageId: 'page',
      name: 'Tasks',
      titlePropertyId: 'title',
      assigneePropertyId: 'assignee',
      dueDatePropertyId: 'due',
    });
  });

  it('trims and saves the new name', async () => {
    await expect(
      handler.execute(new RenameDatabaseCommand('db', '  Sprint backlog ')),
    ).resolves.toEqual({ id: 'db', name: 'Sprint backlog' });
    expect(repository.save).toHaveBeenCalledWith(database);
  });

  it('records the rename by the actor without the names', async () => {
    await handler.execute(new RenameDatabaseCommand('db', 'Backlog', 'user-1'));
    expect(recorder.record).toHaveBeenCalledWith({
      actorId: 'user-1',
      databaseId: 'db',
      action: 'DATABASE_RENAMED',
      field: 'name',
    });
  });

  it('skips the write when the name is unchanged', async () => {
    await handler.execute(new RenameDatabaseCommand('db', 'Tasks'));
    expect(repository.save).not.toHaveBeenCalled();
    expect(recorder.record).not.toHaveBeenCalled();
  });

  it('rejects a blank name and a missing database', async () => {
    await expect(
      handler.execute(new RenameDatabaseCommand('db', '   ')),
    ).rejects.toBeInstanceOf(BadRequestException);

    database = null;
    await expect(
      handler.execute(new RenameDatabaseCommand('db', 'X')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
