import { Database } from '../../../domain/aggregates/database/database.aggregate';
import { DatabaseProperty } from '../../../domain/aggregates/database/database-property.entity';
import { PropertyOption } from '../../../domain/aggregates/database/property-option.entity';
import { PropertyType } from '../../../domain/enums/property-type.enum';
import { UpdatePropertyOptionCommand } from './update-property-option.command';
import { UpdatePropertyOptionHandler } from './update-property-option.handler';

describe('UpdatePropertyOptionHandler', () => {
  let database: Database;
  const databaseRepository = {
    findById: jest.fn(() => Promise.resolve(database)),
    save: jest.fn(() => Promise.resolve()),
  };
  const recorder = { record: jest.fn(() => Promise.resolve()) };
  const publisher = { publish: jest.fn() };
  const handler = new UpdatePropertyOptionHandler(
    databaseRepository as never,
    recorder as never,
    publisher as never,
  );
  const update = (name: string, color: string | null) =>
    handler.execute(
      new UpdatePropertyOptionCommand('db', 'status', 'todo', name, color),
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
    const status = new DatabaseProperty(
      'status',
      'db',
      'Status',
      PropertyType.SELECT,
      false,
      true,
      '1',
    );
    status.addOption(new PropertyOption('todo', 'Todo', '#999999', '0'));
    database.addProperty(status);
  });

  it('announces the row change of its database when the option is renamed', async () => {
    await update('Cần làm', '#999999');

    expect(publisher.publish).toHaveBeenCalledWith('db');
  });

  it('announces nothing when only the color changes', async () => {
    await update('Todo', '#ff0000');

    expect(recorder.record).toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('records and announces nothing when neither name nor color changes', async () => {
    await update('Todo', '#999999');

    expect(recorder.record).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('announces nothing when saving fails', async () => {
    databaseRepository.save.mockRejectedValueOnce(new Error('write failed'));

    await expect(update('Cần làm', '#999999')).rejects.toThrow('write failed');
    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
