import { PageTemplateDatabaseViewProperty } from '../../../../domain/aggregates/template-database/page-template-database-view-property.entity';
import { PageTemplateDatabaseViewPropertyOrmEntity } from '../entities/page-template-database-view-property.orm-entity';

export class PageTemplateDatabaseViewPropertyMapper {
  static toDomain(
    entity: PageTemplateDatabaseViewPropertyOrmEntity,
  ): PageTemplateDatabaseViewProperty {
    return PageTemplateDatabaseViewProperty.restore({
      id: entity.id,
      templateViewId: entity.templateViewId,
      templatePropertyId: entity.templatePropertyId,
      position: entity.position,
      visible: entity.visible,
      width: entity.width,
    });
  }

  static toOrm(
    domain: PageTemplateDatabaseViewProperty,
  ): PageTemplateDatabaseViewPropertyOrmEntity {
    const entity = new PageTemplateDatabaseViewPropertyOrmEntity();
    entity.id = domain.getId();
    entity.templateViewId = domain.getTemplateViewId();
    entity.templatePropertyId = domain.getTemplatePropertyId();
    entity.position = domain.getPosition();
    entity.visible = domain.getVisible();
    entity.width = domain.getWidth();
    return entity;
  }
}
