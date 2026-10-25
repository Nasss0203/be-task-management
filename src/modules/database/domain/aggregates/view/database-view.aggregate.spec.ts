import { DatabaseViewType } from '../../enums/database-view-type.enum';
import { DatabaseViewPropertyNotFoundException } from '../../exceptions/database-view-property-not-found.exception';
import { InvalidDatabaseViewFilterException } from '../../exceptions/invalid-database-view-filter.exception';
import { InvalidDatabaseViewSortException } from '../../exceptions/invalid-database-view-sort.exception';
import { DatabaseView } from './database-view.aggregate';

describe('DatabaseView', () => {
  const databaseId = 'database-id';
  const propertyId = 'property-id';

  const createView = (id: string): DatabaseView => {
    const view = DatabaseView.create({
      id,
      databaseId,
      name: 'Table',
      type: DatabaseViewType.TABLE,
      position: '0',
    });

    view.addProperty({
      id: `${id}-property`,
      propertyId,
      position: '0',
    });

    return view;
  };

  it('updates visibility for only the selected view', () => {
    const tableView = createView('table-view');
    const boardView = createView('board-view');

    tableView.setPropertyVisibility(propertyId, false);

    expect(tableView.getProperties()[0].isVisible()).toBe(false);
    expect(boardView.getProperties()[0].isVisible()).toBe(true);
  });

  it('rejects updates for properties outside the view', () => {
    const view = createView('table-view');

    expect(() => view.setPropertyVisibility('other-property', false)).toThrow(
      DatabaseViewPropertyNotFoundException,
    );
  });

  it('stores sorts in the given order and can clear them', () => {
    const view = createView('table-view');

    view.setSorts([
      { propertyId: 'date', direction: 'asc' },
      { propertyId: 'priority', direction: 'desc' },
    ]);

    expect(view.getSorts()).toEqual([
      { propertyId: 'date', direction: 'asc' },
      { propertyId: 'priority', direction: 'desc' },
    ]);

    view.setSorts([]);

    expect(view.getSorts()).toEqual([]);
  });

  it('stores several filters on one property and drops values of valueless operators', () => {
    const view = createView('table-view');

    view.setFilters([
      { propertyId: 'points', operator: 'gt', value: 3 },
      { propertyId: 'points', operator: 'lt', value: 10 },
      { propertyId: 'name', operator: 'is_empty', value: 'ignored' },
    ]);

    expect(view.getFilters()).toEqual([
      { propertyId: 'points', operator: 'gt', value: 3 },
      { propertyId: 'points', operator: 'lt', value: 10 },
      { propertyId: 'name', operator: 'is_empty', value: null },
    ]);
  });

  it('rejects more than ten filters', () => {
    const view = createView('table-view');

    expect(() =>
      view.setFilters(
        Array.from({ length: 11 }, (_, index) => ({
          propertyId: `p${index}`,
          operator: 'is_empty',
        })),
      ),
    ).toThrow(InvalidDatabaseViewFilterException);
  });

  it('rejects duplicate properties, invalid directions and too many sorts', () => {
    const view = createView('table-view');

    expect(() =>
      view.setSorts([
        { propertyId: 'date', direction: 'asc' },
        { propertyId: 'date', direction: 'desc' },
      ]),
    ).toThrow(InvalidDatabaseViewSortException);

    expect(() =>
      view.setSorts([{ propertyId: 'date', direction: 'up' as 'asc' }]),
    ).toThrow(InvalidDatabaseViewSortException);

    expect(() =>
      view.setSorts(
        ['a', 'b', 'c', 'd', 'e', 'f'].map((propertyId) => ({
          propertyId,
          direction: 'asc' as const,
        })),
      ),
    ).toThrow(InvalidDatabaseViewSortException);
  });
});
