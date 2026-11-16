import { Database } from '../../../domain/aggregates/database/database.aggregate';
import { DatabaseRow } from '../../../domain/aggregates/row/database-row.aggregate';
import { PropertyType } from '../../../domain/enums/property-type.enum';
import { AddPropertyCommand } from './add-property.command';
import { AddPropertyHandler } from './add-property.handler';

describe('AddPropertyHandler', () => {
  let database: Database;
  const databaseRepository = {
    findById: jest.fn(() => Promise.resolve(database)),
    save: jest.fn(() => Promise.resolve()),
  };
  const viewRepository = {
    findByDatabaseId: jest.fn(() => Promise.resolve([])),
    save: jest.fn(() => Promise.resolve()),
  };
  const rowRepository = {
    findByDatabaseId: jest.fn(() =>
      Promise.resolve([DatabaseRow.create({ id: 'row', databaseId: 'db' })]),
    ),
    save: jest.fn(() => Promise.resolve()),
  };
  const recorder = { record: jest.fn(() => Promise.resolve()) };
  const publisher = { publish: jest.fn() };
  const handler = new AddPropertyHandler(
    databaseRepository as never,
    viewRepository as never,
    rowRepository as never,
    recorder as never,
    publisher as never,
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
      titleOnly: true,
    });
  });

  it('announces the row change after giving existing rows the default status', async () => {
    await handler.execute(
      new AddPropertyCommand('db', 'Status', PropertyType.STATUS),
    );

    expect(rowRepository.save).toHaveBeenCalledTimes(1);
    expect(publisher.publish).toHaveBeenCalledWith('db');
  });

  it('announces nothing for a property that leaves rows empty', async () => {
    await handler.execute(
      new AddPropertyCommand('db', 'Notes', PropertyType.TEXT),
    );

    expect(rowRepository.save).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
