import { PersistenceContext } from 'src/shared/domain/persistence-context';
import { Database } from '../aggregates/database/database.aggregate';

export interface DatabaseRepository {
  findById(id: string, context?: PersistenceContext): Promise<Database | null>;

  findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<Database[]>;

  findByPageIds(
    pageIds: string[],
    context?: PersistenceContext,
  ): Promise<Database[]>;

  save(database: Database, context?: PersistenceContext): Promise<void>;

  /** Rows, views and properties are removed by FK cascade. */
  delete(id: string, context?: PersistenceContext): Promise<void>;

  deleteProperty(
    propertyId: string,
    context?: PersistenceContext,
  ): Promise<void>;

  deletePropertyOption(
    optionId: string,
    context?: PersistenceContext,
  ): Promise<void>;
}
