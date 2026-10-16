import { PageTemplateDatabase } from '../../../../domain/aggregates/template-database/page-template-database.aggregate';
import { PageTemplateDatabaseOrmEntity } from '../entities/page-template-database.orm-entity';
import { PageTemplateDatabasePropertyMapper } from './page-template-database-property.mapper';
import { PageTemplateDatabaseRowMapper } from './page-template-database-row.mapper';
import { PageTemplateDatabaseViewMapper } from './page-template-database-view.mapper';

export class PageTemplateDatabaseMapper {
  static toDomain(entity: PageTemplateDatabaseOrmEntity): PageTemplateDatabase {
    return PageTemplateDatabase.restore({
      id: entity.id,
      versionId: entity.versionId,
      name: entity.name,
      properties:
        entity.properties?.map((property) =>
          PageTemplateDatabasePropertyMapper.toDomain(property),
        ) ?? [],
      rows:
        entity.rows?.map((row) =>
          PageTemplateDatabaseRowMapper.toDomain(row),
        ) ?? [],
      views:
        entity.views?.map((view) =>
          PageTemplateDatabaseViewMapper.toDomain(view),
        ) ?? [],
    });
  }

  static toOrm(domain: PageTemplateDatabase): PageTemplateDatabaseOrmEntity {
    const entity = new PageTemplateDatabaseOrmEntity();
    entity.id = domain.getId();
    entity.versionId = domain.getVersionId();
    entity.name = domain.getName();
    entity.properties = domain
      .getProperties()
      .map((property) => PageTemplateDatabasePropertyMapper.toOrm(property));
    entity.rows = domain
      .getRows()
      .map((row) => PageTemplateDatabaseRowMapper.toOrm(row));
    entity.views = domain
      .getViews()
      .map((view) => PageTemplateDatabaseViewMapper.toOrm(view));
    return entity;
  }
}
