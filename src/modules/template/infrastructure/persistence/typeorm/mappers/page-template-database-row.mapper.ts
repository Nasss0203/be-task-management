import { PageTemplateDatabaseRow } from '../../../../domain/aggregates/template-database/page-template-database-row.entity';
import { PageTemplateDatabaseRowOrmEntity } from '../entities/page-template-database-row.orm-entity';
import { PageTemplateDatabaseRowValueMapper } from './page-template-database-row-value.mapper';

export class PageTemplateDatabaseRowMapper {
  static toDomain(
    entity: PageTemplateDatabaseRowOrmEntity,
  ): PageTemplateDatabaseRow {
    return PageTemplateDatabaseRow.restore({
      id: entity.id,
      templateDatabaseId: entity.templateDatabaseId,
      values:
        entity.values?.map((value) =>
          PageTemplateDatabaseRowValueMapper.toDomain(value),
        ) ?? [],
    });
  }

  static toOrm(
    domain: PageTemplateDatabaseRow,
  ): PageTemplateDatabaseRowOrmEntity {
    const entity = new PageTemplateDatabaseRowOrmEntity();
    entity.id = domain.getId();
    entity.templateDatabaseId = domain.getTemplateDatabaseId();
    entity.values = domain
      .getValues()
      .map((value) => PageTemplateDatabaseRowValueMapper.toOrm(value));
    return entity;
  }
}
