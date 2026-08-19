import { DatabaseView } from '../aggregates/view/database-view.aggregate';

export interface DatabaseViewRepository {
  findById(id: string): Promise<DatabaseView | null>;

  findByDatabaseId(databaseId: string): Promise<DatabaseView[]>;

  save(view: DatabaseView): Promise<void>;

  delete(id: string): Promise<void>;
}
