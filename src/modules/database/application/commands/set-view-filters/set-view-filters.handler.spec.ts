import { BadRequestException, NotFoundException } from '@nestjs/common';

import { DatabaseProperty } from '../../../domain/aggregates/database/database-property.entity';
import { PropertyOption } from '../../../domain/aggregates/database/property-option.entity';
import { DatabaseView } from '../../../domain/aggregates/view/database-view.aggregate';
import { DatabaseViewType } from '../../../domain/enums/database-view-type.enum';
import { PropertyType } from '../../../domain/enums/property-type.enum';
import { SetViewFiltersCommand } from './set-view-filters.command';
import { SetViewFiltersHandler } from './set-view-filters.handler';

describe('SetViewFiltersHandler', () => {
  const properties = [
    new DatabaseProperty('name', 'db', 'Name', PropertyType.TITLE, true, false, '0'),
    new DatabaseProperty('points', 'db', 'Points', PropertyType.NUMBER, false, true, '1'),
    new DatabaseProperty('due', 'db', 'Due', PropertyType.DATE, false, true, '2'),
    new DatabaseProperty('status', 'db', 'Status', PropertyType.STATUS, false, true, '3', [
      new PropertyOption('todo', 'Todo', null, '0'),
      new PropertyOption('done', 'Done', null, '1'),
    ]),
    new DatabaseProperty('people', 'db', 'People', PropertyType.PERSON, false, true, '4'),
  ];
  let view: DatabaseView;
  const viewRepository = {
    findById: jest.fn(() => Promise.resolve(view)),
    save: jest.fn(),
  };
  const databaseRepository = {
    findById: jest.fn(() => Promise.resolve({ getProperties: () => properties })),
  };
  const handler = new SetViewFiltersHandler(
    viewRepository as never,
    databaseRepository as never,
  );
  const run = (filters: SetViewFiltersCommand['filters']) =>
    handler.execute(new SetViewFiltersCommand('db', 'view', filters));

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

  it('saves valid filters for each property type', async () => {
    const result = await run([
      { propertyId: 'name', operator: 'contains', value: 'kế hoạch' },
      { propertyId: 'points', operator: 'gte', value: 3 },
      { propertyId: 'due', operator: 'before', value: '2026-10-30' },
      { propertyId: 'status', operator: 'is_not', value: 'done' },
    ]);

    expect(result.filters).toHaveLength(4);
    expect(viewRepository.save).toHaveBeenCalledWith(view);
  });

  it.each([
    ['operator of another type', { propertyId: 'points', operator: 'contains', value: '3' }],
    ['unsupported property type', { propertyId: 'people', operator: 'is_empty' }],
    ['number given as string', { propertyId: 'points', operator: 'gt', value: '3' }],
    ['malformed date', { propertyId: 'due', operator: 'on', value: '30/10/2026' }],
    ['option from elsewhere', { propertyId: 'status', operator: 'is', value: 'other' }],
    ['text given as number', { propertyId: 'name', operator: 'equals', value: 3 }],
  ])('rejects %s', async (_, filter) => {
    await expect(run([filter])).rejects.toBeInstanceOf(BadRequestException);
    expect(viewRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a property outside the database', async () => {
    await expect(
      run([{ propertyId: 'ghost', operator: 'is_empty' }]),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('keeps a just-added condition without a value as an incomplete filter', async () => {
    const result = await run([{ propertyId: 'points', operator: 'gt' }]);
    expect(result.filters).toEqual([
      { propertyId: 'points', operator: 'gt', value: null },
    ]);
  });

  it('accepts valueless operators without a value', async () => {
    const result = await run([{ propertyId: 'status', operator: 'is_empty' }]);
    expect(result.filters).toEqual([
      { propertyId: 'status', operator: 'is_empty', value: null },
    ]);
  });
});
