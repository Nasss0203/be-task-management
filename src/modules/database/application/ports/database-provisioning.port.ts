import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { RowValueData } from '../../domain/aggregates/row/row-value.type';
import type { DatabaseViewType } from '../../domain/enums/database-view-type.enum';
import type { PropertyType } from '../../domain/enums/property-type.enum';

export interface ProvisionDatabasePropertyOptionSnapshot {
  sourceId: string;
  name: string;
  color: string | null;
  position: string;
}

export interface ProvisionDatabasePropertySnapshot {
  sourceId: string;
  name: string;
  type: PropertyType;
  isDefault: boolean;
  isHideable: boolean;
  position: string;
  options: ProvisionDatabasePropertyOptionSnapshot[];
}

export interface ProvisionDatabaseRowValueSnapshot {
  sourceId: string;
  propertySourceId: string;
  value: RowValueData;
}

export interface ProvisionDatabaseRowSnapshot {
  sourceId: string;
  values: ProvisionDatabaseRowValueSnapshot[];
}

export interface ProvisionDatabaseViewPropertySnapshot {
  sourceId: string;
  propertySourceId: string;
  position: string;
  visible: boolean;
  width: number | null;
}

export interface ProvisionDatabaseViewSnapshot {
  sourceId: string;
  name: string;
  type: DatabaseViewType;
  position: string;
  properties: ProvisionDatabaseViewPropertySnapshot[];
}

export interface ProvisionDatabaseSnapshot {
  sourceId: string;
  name: string;
  properties: ProvisionDatabasePropertySnapshot[];
  rows: ProvisionDatabaseRowSnapshot[];
  views: ProvisionDatabaseViewSnapshot[];
}

export interface ProvisionDatabasesInput {
  pageId: string;
  databases: ProvisionDatabaseSnapshot[];
}

export interface DatabaseProvisioningResult {
  databaseIdMap: Map<string, string>;
  propertyIdMap: Map<string, string>;
  optionIdMap: Map<string, string>;
  rowIdMap: Map<string, string>;
  viewIdMap: Map<string, string>;
}

export interface DatabaseProvisioningPort {
  provisionDatabases(
    input: ProvisionDatabasesInput,
    context?: PersistenceContext,
  ): Promise<DatabaseProvisioningResult>;
}
