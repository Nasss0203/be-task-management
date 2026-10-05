import type { RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';
import type { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import type { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import type { PageTemplateDatabase } from '../../../domain/aggregates/template-database/page-template-database.aggregate';

export class PageTemplateDatabaseResponseDto {
  id: string;
  version_id: string;
  name: string;
  properties: {
    id: string;
    template_database_id: string;
    name: string;
    type: PropertyType;
    is_default: boolean;
    is_hideable: boolean;
    position: string;
    options: {
      id: string;
      template_property_id: string;
      name: string;
      color: string | null;
      position: string;
    }[];
  }[];
  rows: {
    id: string;
    template_database_id: string;
    values: {
      id: string;
      template_row_id: string;
      template_property_id: string;
      value: RowValueData;
    }[];
  }[];
  views: {
    id: string;
    template_database_id: string;
    name: string;
    type: DatabaseViewType;
    position: string;
    properties: {
      id: string;
      template_view_id: string;
      template_property_id: string;
      position: string;
      visible: boolean;
      width: number | null;
    }[];
  }[];

  static fromDomain(
    database: PageTemplateDatabase,
  ): PageTemplateDatabaseResponseDto {
    const dto = new PageTemplateDatabaseResponseDto();
    dto.id = database.getId();
    dto.version_id = database.getVersionId();
    dto.name = database.getName();
    dto.properties = database.getProperties().map((property) => ({
      id: property.getId(),
      template_database_id: property.getTemplateDatabaseId(),
      name: property.getName(),
      type: property.getType(),
      is_default: property.getIsDefault(),
      is_hideable: property.getIsHideable(),
      position: property.getPosition(),
      options: property.getOptions().map((option) => ({
        id: option.getId(),
        template_property_id: option.getTemplatePropertyId(),
        name: option.getName(),
        color: option.getColor(),
        position: option.getPosition(),
      })),
    }));
    dto.rows = database.getRows().map((row) => ({
      id: row.getId(),
      template_database_id: row.getTemplateDatabaseId(),
      values: row.getValues().map((value) => ({
        id: value.getId(),
        template_row_id: value.getTemplateRowId(),
        template_property_id: value.getTemplatePropertyId(),
        value: structuredClone(value.getValue()),
      })),
    }));
    dto.views = database.getViews().map((view) => ({
      id: view.getId(),
      template_database_id: view.getTemplateDatabaseId(),
      name: view.getName(),
      type: view.getType(),
      position: view.getPosition(),
      properties: view.getProperties().map((property) => ({
        id: property.getId(),
        template_view_id: property.getTemplateViewId(),
        template_property_id: property.getTemplatePropertyId(),
        position: property.getPosition(),
        visible: property.getVisible(),
        width: property.getWidth(),
      })),
    }));
    return dto;
  }
}
