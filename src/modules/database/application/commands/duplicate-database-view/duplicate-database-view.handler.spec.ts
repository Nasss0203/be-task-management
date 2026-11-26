import { NotFoundException } from '@nestjs/common';

import { DatabaseView } from '../../../domain/aggregates/view/database-view.aggregate';
import { DatabaseViewType } from '../../../domain/enums/database-view-type.enum';
import { DuplicateDatabaseViewCommand } from './duplicate-database-view.command';
import { DuplicateDatabaseViewHandler } from './duplicate-database-view.handler';

describe('DuplicateDatabaseViewHandler', () => {
  let source: DatabaseView | null;
  const viewRepository = {
    findById: jest.fn(() => Promise.resolve(source)),
    findByDatabaseId: jest.fn(() => Promise.resolve([source, {}, {}])),
    save: jest.fn<Promise<void>, [DatabaseView]>(() => Promise.resolve()),
  };
  const handler = new DuplicateDatabaseViewHandler(viewRepository as never);
  const run = (databaseId = 'db') =>
    handler.execute(new DuplicateDatabaseViewCommand(databaseId, 'board'));

  beforeEach(() => {
    jest.clearAllMocks();
    source = DatabaseView.create({
      id: 'board',
      databaseId: 'db',
      name: 'By status',
      type: DatabaseViewType.BOARD,
      position: '1',
    });
    source.addProperty({
      id: 'vp-1',
      propertyId: 'name',
      position: '0',
      visible: true,
      width: 320,
    });
    source.addProperty({
      id: 'vp-2',
      propertyId: 'status',
      position: '1',
      visible: false,
      width: null,
    });
    source.setSorts([{ propertyId: 'name', direction: 'desc' }]);
    source.setFilters([
      { propertyId: 'status', operator: 'is', value: 'done' },
    ]);
    source.setGroupBy('status');
  });

  it('copies type, sorts, filters, group and column settings into a new view at the end', async () => {
    const result = await run();

    const copy = viewRepository.save.mock.calls[0][0];
    expect(result).toEqual(
      expect.objectContaining({
        name: 'By status (copy)',
        type: DatabaseViewType.BOARD,
        position: '3',
      }),
    );
    expect(copy.getId()).not.toBe('board');
    expect(copy.getSorts()).toEqual([
      { propertyId: 'name', direction: 'desc' },
    ]);
    expect(copy.getFilters()).toEqual([
      { propertyId: 'status', operator: 'is', value: 'done' },
    ]);
    expect(copy.getGroupBy()).toBe('status');
    expect(
      copy
        .getProperties()
        .map((item) => [
          item.getPropertyId(),
          item.getPosition(),
          item.isVisible(),
          item.getWidth(),
        ]),
    ).toEqual([
      ['name', '0', true, 320],
      ['status', '1', false, null],
    ]);
    expect(copy.getProperties().map((item) => item.getId())).not.toContain(
      'vp-1',
    );
    expect(
      copy.getProperties().every((item) => item.getViewId() === copy.getId()),
    ).toBe(true);
  });

  it('leaves the source view unchanged when the copy is edited', async () => {
    await run();
    const copy = viewRepository.save.mock.calls[0][0];

    copy.setFilters([]);

    expect(source?.getFilters()).toHaveLength(1);
    expect(source?.getName()).toBe('By status');
  });

  it('keeps the copied name within 255 characters', async () => {
    source?.rename('x'.repeat(255));

    const result = await run();

    expect(result.name).toHaveLength(255);
    expect(result.name.endsWith(' (copy)')).toBe(true);
  });

  it('rejects a view from another database', async () => {
    await expect(run('other-db')).rejects.toBeInstanceOf(NotFoundException);
    expect(viewRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a missing view', async () => {
    source = null;

    await expect(run()).rejects.toBeInstanceOf(NotFoundException);
    expect(viewRepository.save).not.toHaveBeenCalled();
  });
});
