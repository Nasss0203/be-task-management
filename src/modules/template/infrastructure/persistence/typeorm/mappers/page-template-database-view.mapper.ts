import { PageTemplateDatabaseView } from '../../../../domain/aggregates/template-database/page-template-database-view.entity';
import { PageTemplateDatabaseViewOrmEntity } from '../entities/page-template-database-view.orm-entity';
import { PageTemplateDatabaseViewPropertyMapper } from './page-template-database-view-property.mapper';

export class PageTemplateDatabaseViewMapper {
  static toDomain(
    entity: PageTemplateDatabaseViewOrmEntity,
  ): PageTemplateDatabaseView {
    return PageTemplateDatabaseView.restore({
      id: entity.id,
      templateDatabaseId: entity.templateDatabaseId,
      name: entity.name,
      type: entity.type,
      position: entity.position,
      properties:
        entity.properties?.map((property) =>
          PageTemplateDatabaseViewPropertyMapper.toDomain(property),
        ) ?? [],
    });
  }

  static toOrm(
    domain: PageTemplateDatabaseView,
  ): PageTemplateDatabaseViewOrmEntity {
    const entity = new PageTemplateDatabaseViewOrmEntity();
    entity.id = domain.getId();
    entity.templateDatabaseId = domain.getTemplateDatabaseId();
    entity.name = domain.getName();
    entity.type = domain.getType();
    entity.position = domain.getPosition();
    entity.properties = domain
      .getProperties()
      .map((property) =>
        PageTemplateDatabaseViewPropertyMapper.toOrm(property),
      );
    return entity;
  }
}
