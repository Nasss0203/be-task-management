import { BadRequestException, NotFoundException } from '@nestjs/common';

import { DatabaseProperty } from '../../../domain/aggregates/database/database-property.entity';
import { PropertyOption } from '../../../domain/aggregates/database/property-option.entity';
import { DatabaseView } from '../../../domain/aggregates/view/database-view.aggregate';
import { DatabaseViewType } from '../../../domain/enums/database-view-type.enum';
import { PropertyType } from '../../../domain/enums/property-type.enum';
import { SetViewGroupCommand } from './set-view-group.command';
import { SetViewGroupHandler } from './set-view-group.handler';

describe('SetViewGroupHandler', () => {
  const properties = [
    new DatabaseProperty('name', 'db', 'Name', PropertyType.TITLE, true, false, '0'),
    new DatabaseProperty('status', 'db', 'Status', PropertyType.STATUS, false, true, '1', [
      new PropertyOption('todo', 'Todo', null, '0'),
    ]),
    new DatabaseProperty('done', 'db', 'Done', PropertyType.CHECKBOX, false, true, '2'),
  ];
  let view: DatabaseView;
  const viewRepository = {
    findById: jest.fn(() => Promise.resolve(view)),
    save: jest.fn(),
  };
  const databaseRepository = {
    findById: jest.fn(() => Promise.resolve({ getProperties: () => properties })),
  };
  const handler = new SetViewGroupHandler(
    viewRepository as never,
    databaseRepository as never,
  );
  const run = (propertyId: string | null) =>
    handler.execute(new SetViewGroupCommand('db', 'view', propertyId));

  beforeEach(() => {
    jest.clearAllMocks();
    view = DatabaseView.create({
      id: 'view',
      databaseId: 'db',
      name: 'Table',
      type: DatabaseViewType.TABLE,
      position: '0',
    });
  });

  it('groups by status or checkbox and can clear the grouping', async () => {
    await expect(run('status')).resolves.toMatchObject({ groupBy: 'status' });
    await expect(run('done')).resolves.toMatchObject({ groupBy: 'done' });
    await expect(run(null)).resolves.toMatchObject({ groupBy: null });
    expect(viewRepository.save).toHaveBeenCalledTimes(3);
  });

  it('rejects ungroupable or foreign properties', async () => {
    await expect(run('name')).rejects.toBeInstanceOf(BadRequestException);
    await expect(run('ghost')).rejects.toBeInstanceOf(NotFoundException);
    expect(viewRepository.save).not.toHaveBeenCalled();
  });
});
