import { DatabaseViewType } from '../../enums/database-view-type.enum';
import { DatabaseViewPropertyNotFoundException } from '../../exceptions/database-view-property-not-found.exception';
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
});
