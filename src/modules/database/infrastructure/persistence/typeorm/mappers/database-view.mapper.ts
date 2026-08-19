import { DatabaseViewProperty } from '../../../../domain/aggregates/view/database-view-property.entity';
import { DatabaseView } from '../../../../domain/aggregates/view/database-view.aggregate';
import { DatabaseViewPropertyOrmEntity } from '../entities/database-view-property.orm-entity';
import { DatabaseViewOrmEntity } from '../entities/database-view.orm-entity';

export class DatabaseViewMapper {
  static toDomain(orm: DatabaseViewOrmEntity): DatabaseView {
    const properties = (orm.properties ?? []).map((property) =>
      DatabaseViewProperty.restore({
        id: property.id,
        viewId: property.viewId,
        propertyId: property.propertyId,
        position: property.position,
        visible: property.visible,
        width: property.width,
      }),
    );

    return DatabaseView.restore({
      id: orm.id,
      databaseId: orm.databaseId,
      name: orm.name,
      type: orm.type,
      position: orm.position,
      properties,
    });
  }

  static toOrm(view: DatabaseView): DatabaseViewOrmEntity {
    const orm = new DatabaseViewOrmEntity();

    orm.id = view.getId();
    orm.databaseId = view.getDatabaseId();
    orm.name = view.getName();
    orm.type = view.getType();
    orm.position = view.getPosition();

    orm.properties = view.getProperties().map((property) => {
      const propertyOrm = new DatabaseViewPropertyOrmEntity();

      propertyOrm.id = property.getId();
      propertyOrm.viewId = property.getViewId();
      propertyOrm.propertyId = property.getPropertyId();
      propertyOrm.position = property.getPosition();
      propertyOrm.visible = property.isVisible();
      propertyOrm.width = property.getWidth();

      return propertyOrm;
    });

    return orm;
  }
}
