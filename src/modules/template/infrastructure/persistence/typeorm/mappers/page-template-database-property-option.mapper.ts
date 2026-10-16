import { PageTemplateDatabasePropertyOption } from '../../../../domain/aggregates/template-database/page-template-database-property-option.entity';
import { PageTemplateDatabasePropertyOptionOrmEntity } from '../entities/page-template-database-property-option.orm-entity';

export class PageTemplateDatabasePropertyOptionMapper {
  static toDomain(
    entity: PageTemplateDatabasePropertyOptionOrmEntity,
  ): PageTemplateDatabasePropertyOption {
    return PageTemplateDatabasePropertyOption.restore({
      id: entity.id,
      templatePropertyId: entity.templatePropertyId,
      name: entity.name,
      color: entity.color,
      position: entity.position,
    });
  }

  static toOrm(
    domain: PageTemplateDatabasePropertyOption,
  ): PageTemplateDatabasePropertyOptionOrmEntity {
    const entity = new PageTemplateDatabasePropertyOptionOrmEntity();
    entity.id = domain.getId();
    entity.templatePropertyId = domain.getTemplatePropertyId();
    entity.name = domain.getName();
    entity.color = domain.getColor();
    entity.position = domain.getPosition();
    return entity;
  }
}
