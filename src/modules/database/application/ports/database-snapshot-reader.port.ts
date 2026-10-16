import { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { RowValueData } from '../../domain/aggregates/row/row-value.type';
import { DatabaseViewType } from '../../domain/enums/database-view-type.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';

export interface DatabaseSnapshotDatabase {
  id: string;
  pageId: string;
  name: string;
}

export interface DatabaseSnapshotPropertyOption {
  id: string;
  propertyId: string;
  name: string;
  color: string | null;
  position: string;
}

export interface DatabaseSnapshotProperty {
  id: string;
  databaseId: string;
  name: string;
  type: PropertyType;
  isDefault: boolean;
  isHideable: boolean;
  position: string;
  options: DatabaseSnapshotPropertyOption[];
}

export interface DatabaseSnapshotRowValue {
  id: string;
  rowId: string;
  propertyId: string;
  value: RowValueData;
}

export interface DatabaseSnapshotRow {
  id: string;
  databaseId: string;
  values: DatabaseSnapshotRowValue[];
}

export interface DatabaseSnapshotViewProperty {
  id: string;
  viewId: string;
  propertyId: string;
  position: string;
  visible: boolean;
  width: number | null;
}

export interface DatabaseSnapshotView {
  id: string;
  databaseId: string;
  name: string;
  type: DatabaseViewType;
  position: string;
  properties: DatabaseSnapshotViewProperty[];
}

export interface DatabaseSnapshot {
  database: DatabaseSnapshotDatabase;
  properties: DatabaseSnapshotProperty[];
  rows: DatabaseSnapshotRow[];
  views: DatabaseSnapshotView[];
}

export interface DatabaseSnapshotReaderPort {
  getDatabaseSnapshot(
    databaseId: string,
    context?: PersistenceContext,
  ): Promise<DatabaseSnapshot | null>;
}
