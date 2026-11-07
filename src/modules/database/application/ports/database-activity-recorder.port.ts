import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { RowValueData } from '../../domain/aggregates/row/row-value.type';

export type DatabaseEditAction =
  | 'DATABASE_CREATED'
  | 'DATABASE_RENAMED'
  | 'DATABASE_PROPERTY_ADDED'
  | 'DATABASE_PROPERTY_UPDATED'
  | 'DATABASE_PROPERTY_DELETED'
  | 'DATABASE_ROW_CREATED'
  | 'DATABASE_ROW_UPDATED'
  | 'DATABASE_ROW_DELETED'
  | 'DATABASE_ROW_MOVED';

export type DatabaseEditKind =
  | 'OPTION_ADDED'
  | 'OPTION_UPDATED'
  | 'OPTION_DELETED'
  | 'PARENT_CHANGED'
  | 'CLEARED';

export interface DatabaseEdit {
  actorId?: string | null;
  databaseId: string;
  action: DatabaseEditAction;
  rowId?: string;
  propertyId?: string;
  optionId?: string;
  field?: string;
  kind?: DatabaseEditKind;
  newValue?: RowValueData;
}

export interface DatabaseActivityRecorder {
  record(edit: DatabaseEdit, context?: PersistenceContext): Promise<void>;
}
