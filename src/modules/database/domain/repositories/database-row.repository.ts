import { DatabaseRow } from '../aggregates/row/database-row.aggregate';

export interface DatabaseRowRepository {
  findById(id: string): Promise<DatabaseRow | null>;

  findByDatabaseId(databaseId: string): Promise<DatabaseRow[]>;

  save(row: DatabaseRow): Promise<void>;

  delete(id: string): Promise<void>;

  deleteValue(rowId: string, propertyId: string): Promise<void>;

  isPropertyOptionInUse(propertyId: string, optionId: string): Promise<boolean>;
}
