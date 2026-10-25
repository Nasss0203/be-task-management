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
    options?: {
      limit?: number;
    },
  ): Promise<DatabaseRow[]>;

  countByDatabaseId(
    databaseId: string,
    context?: PersistenceContext,
  ): Promise<number>;

  findMaxPosition(
    databaseId: string,
    context?: PersistenceContext,
  ): Promise<number | null>;

  updatePositions(
    positions: { id: string; position: number }[],
    context?: PersistenceContext,
  ): Promise<void>;

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
