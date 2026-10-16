import { PageTemplateDatabaseProperty } from '../../../../domain/aggregates/template-database/page-template-database-property.entity';
import { PageTemplateDatabasePropertyOrmEntity } from '../entities/page-template-database-property.orm-entity';
import { PageTemplateDatabasePropertyOptionMapper } from './page-template-database-property-option.mapper';

export class PageTemplateDatabasePropertyMapper {
  static toDomain(
    entity: PageTemplateDatabasePropertyOrmEntity,
  ): PageTemplateDatabaseProperty {
    return PageTemplateDatabaseProperty.restore({
      id: entity.id,
      templateDatabaseId: entity.templateDatabaseId,
      name: entity.name,
      type: entity.type,
      isDefault: entity.isDefault,
      isHideable: entity.isHideable,
      position: entity.position,
      options:
        entity.options?.map((option) =>
          PageTemplateDatabasePropertyOptionMapper.toDomain(option),
        ) ?? [],
    });
  }

  static toOrm(
    domain: PageTemplateDatabaseProperty,
  ): PageTemplateDatabasePropertyOrmEntity {
    const entity = new PageTemplateDatabasePropertyOrmEntity();
    entity.id = domain.getId();
    entity.templateDatabaseId = domain.getTemplateDatabaseId();
    entity.name = domain.getName();
    entity.type = domain.getType();
    entity.isDefault = domain.getIsDefault();
    entity.isHideable = domain.getIsHideable();
    entity.position = domain.getPosition();
    entity.options = domain
      .getOptions()
      .map((option) => PageTemplateDatabasePropertyOptionMapper.toOrm(option));
    return entity;
  }
}
