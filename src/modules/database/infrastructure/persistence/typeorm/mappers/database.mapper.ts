import { DatabaseProperty } from '../../../../domain/aggregates/database/database-property.entity';
import { Database } from '../../../../domain/aggregates/database/database.aggregate';
import { PropertyOption } from '../../../../domain/aggregates/database/property-option.entity';

import { DatabasePropertyOrmEntity } from '../entities/database-property.orm-entity';
import { DatabaseOrmEntity } from '../entities/database.orm-entity';
import { PropertyOptionOrmEntity } from '../entities/property-option.orm-entity';

export class DatabaseMapper {
  static toOrm(domain: Database): DatabaseOrmEntity {
    const orm = new DatabaseOrmEntity();

    orm.id = domain.getId();
    orm.pageId = domain.getPageId();
    orm.name = domain.getName();

    orm.properties = domain.getProperties().map((property) => {
      const propertyOrm = this.propertyToOrm(property);

      propertyOrm.database = orm;

      return propertyOrm;
    });

    return orm;
  }

  static toDomain(orm: DatabaseOrmEntity): Database {
    const properties = (orm.properties ?? []).map((property) =>
      this.propertyToDomain(property),
    );

    return Database.restore({
      id: orm.id,
      pageId: orm.pageId,
      name: orm.name,
      properties,
    });
  }

  private static propertyToOrm(
    domain: DatabaseProperty,
  ): DatabasePropertyOrmEntity {
    const orm = new DatabasePropertyOrmEntity();

    orm.id = domain.getId();
    orm.databaseId = domain.getDatabaseId();
    orm.name = domain.getName();
    orm.type = domain.getType();
    orm.isDefault = domain.getIsDefault();
    orm.isHideable = domain.getIsHideable();
    orm.position = domain.getPosition();

    orm.options = domain.getOptions().map((option) => {
      const optionOrm = this.optionToOrm(option, domain.getId());

      optionOrm.property = orm;

      return optionOrm;
    });

    return orm;
  }

  private static propertyToDomain(
    orm: DatabasePropertyOrmEntity,
  ): DatabaseProperty {
    const options = (orm.options ?? []).map((option) =>
      this.optionToDomain(option),
    );

    return new DatabaseProperty(
      orm.id,
      orm.databaseId,
      orm.name,
      orm.type,
      orm.isDefault,
      orm.isHideable,
      orm.position,
      options,
    );
  }

  private static optionToOrm(
    domain: PropertyOption,
    propertyId: string,
  ): PropertyOptionOrmEntity {
    const orm = new PropertyOptionOrmEntity();

    orm.id = domain.getId();
    orm.propertyId = propertyId;
    orm.name = domain.getName();
    orm.color = domain.getColor();
    orm.position = domain.getPosition();

    return orm;
  }

  private static optionToDomain(orm: PropertyOptionOrmEntity): PropertyOption {
    return new PropertyOption(orm.id, orm.name, orm.color, orm.position);
  }
}
