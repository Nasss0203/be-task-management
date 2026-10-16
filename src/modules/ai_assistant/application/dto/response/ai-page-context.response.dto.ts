import { type RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import {
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/shared/domain/page-block.types';

export interface AiPageContextPageDto {
  id: string;
  workspaceId: string;
  teamspaceId: string | null;
  parentPageId: string | null;

  title: string;
  icon: string | null;
  coverUrl: string | null;

  updatedAt: string;
}

export interface AiPageBlockContextDto {
  id: string;
  parentBlockId: string | null;

  type: PageBlockType;
  orderIndex: number;

  title: string | null;

  content: PageBlockJson;
  styleConfig: PageBlockStyleConfig;
  dataConfig: PageBlockJson;
}

export interface AiDatabaseViewReferenceContextDto {
  blockId: string;
  databaseId: string;
  viewId: string;
}

export interface AiDatabasePropertyOptionContextDto {
  id: string;
  name: string;
  color: string | null;
  position: string;
}

export interface AiDatabasePropertyContextDto {
  id: string;

  name: string;
  type: PropertyType;

  position: string;

  isDefault: boolean;
  isHideable: boolean;

  options: AiDatabasePropertyOptionContextDto[];
}

export interface AiDatabaseViewPropertyContextDto {
  propertyId: string;

  position: string;
  visible: boolean;
  width: number | null;
}

export interface AiDatabaseViewContextDto {
  id: string;
  databaseId: string;

  name: string;
  type: DatabaseViewType;

  position: string;

  properties: AiDatabaseViewPropertyContextDto[];
}

export interface AiDatabaseRowContextDto {
  id: string;
  databaseId: string;

  values: Record<string, RowValueData>;
}

export interface AiDatabaseContextDto {
  id: string;
  pageId: string;

  name: string;

  properties: AiDatabasePropertyContextDto[];

  views: AiDatabaseViewContextDto[];

  rows: AiDatabaseRowContextDto[];
}

export interface AiContextCollectionCompletenessDto {
  total: number;
  included: number;
  truncated: boolean;
}

export interface AiDatabaseRowsCompletenessDto extends AiContextCollectionCompletenessDto {
  databaseId: string;

  selection: 'BOUNDED';
}

export interface AiPageContextCompletenessDto {
  blocks: AiContextCollectionCompletenessDto;
  databases: AiContextCollectionCompletenessDto;

  rows: AiDatabaseRowsCompletenessDto[];

  textTruncated: boolean;
}

export interface AiPageContextResponseDto {
  schemaVersion: 1;

  builtAt: string;

  page: AiPageContextPageDto;

  blocks: AiPageBlockContextDto[];

  databaseReferences: AiDatabaseViewReferenceContextDto[];

  databases: AiDatabaseContextDto[];

  completeness: AiPageContextCompletenessDto;
}
