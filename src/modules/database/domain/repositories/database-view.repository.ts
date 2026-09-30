import { PersistenceContext } from 'src/shared/domain/persistence-context';
import { DatabaseView } from '../aggregates/view/database-view.aggregate';

export interface DatabaseViewRepository {
  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<DatabaseView | null>;

  findByDatabaseId(
    databaseId: string,
    context?: PersistenceContext,
  ): Promise<DatabaseView[]>;

  save(view: DatabaseView, context?: PersistenceContext): Promise<void>;

  delete(id: string, context?: PersistenceContext): Promise<void>;
}
