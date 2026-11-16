import { ConflictException } from '@nestjs/common';

import { Database } from '../../../domain/aggregates/database/database.aggregate';
import { RenamePropertyCommand } from './rename-property.command';
import { RenamePropertyHandler } from './rename-property.handler';

describe('RenamePropertyHandler', () => {
  let database: Database;
  const databaseRepository = {
    findById: jest.fn(() => Promise.resolve(database)),
    save: jest.fn(() => Promise.resolve()),
  };
  const recorder = { record: jest.fn(() => Promise.resolve()) };
  const publisher = { publish: jest.fn() };
  const handler = new RenamePropertyHandler(
    databaseRepository as never,
    recorder as never,
    publisher as never,
  );
  const dueName = () =>
    database
      .getProperties()
      .find((item) => item.getId() === 'due')!
      .getName();

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

  it('announces the row change of its database after a rename', async () => {
    await handler.execute(new RenamePropertyCommand('db', 'title', 'Task'));

    expect(databaseRepository.save).toHaveBeenCalled();
    expect(publisher.publish).toHaveBeenCalledWith('db');
  });

  it('announces nothing when the name stays the same', async () => {
    const current = database
      .getProperties()
      .find((item) => item.getId() === 'title')!
      .getName();

    await handler.execute(new RenamePropertyCommand('db', 'title', current));

    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('announces nothing when the rename is rejected', async () => {
    await expect(
      handler.execute(new RenamePropertyCommand('db', 'title', dueName())),
    ).rejects.toBeInstanceOf(ConflictException);

    databaseRepository.save.mockRejectedValueOnce(new Error('write failed'));
    await expect(
      handler.execute(new RenamePropertyCommand('db', 'title', 'Task')),
    ).rejects.toThrow('write failed');

    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
