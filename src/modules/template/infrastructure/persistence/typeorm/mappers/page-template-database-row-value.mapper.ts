import { PageTemplateDatabaseRowValue } from '../../../../domain/aggregates/template-database/page-template-database-row-value.entity';
import { PageTemplateDatabaseRowValueOrmEntity } from '../entities/page-template-database-row-value.orm-entity';

export class PageTemplateDatabaseRowValueMapper {
  static toDomain(
    entity: PageTemplateDatabaseRowValueOrmEntity,
  ): PageTemplateDatabaseRowValue {
    return PageTemplateDatabaseRowValue.restore({
      id: entity.id,
      templateRowId: entity.templateRowId,
      templatePropertyId: entity.templatePropertyId,
      value: entity.value,
    });
  }

  static toOrm(
    domain: PageTemplateDatabaseRowValue,
  ): PageTemplateDatabaseRowValueOrmEntity {
    const entity = new PageTemplateDatabaseRowValueOrmEntity();
    entity.id = domain.getId();
    entity.templateRowId = domain.getTemplateRowId();
    entity.templatePropertyId = domain.getTemplatePropertyId();
    entity.value = domain.getValue();
    return entity;
  }
}
