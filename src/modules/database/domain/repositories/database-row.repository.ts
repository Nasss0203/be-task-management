import { PersistenceContext } from 'src/shared/domain/persistence-context';
import { DatabaseRow } from '../aggregates/row/database-row.aggregate';

export interface DatabaseRowRepository {
  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<DatabaseRow | null>;

  findByDatabaseId(
    databaseId: string,
    context?: PersistenceContext,
  ): Promise<DatabaseRow[]>;

  save(row: DatabaseRow, context?: PersistenceContext): Promise<void>;

  delete(id: string, context?: PersistenceContext): Promise<void>;

  deleteValue(
    rowId: string,
    propertyId: string,
    context?: PersistenceContext,
  ): Promise<void>;

  isPropertyOptionInUse(
    propertyId: string,
    optionId: string,
    context?: PersistenceContext,
  ): Promise<boolean>;
}
