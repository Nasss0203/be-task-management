import { Database } from '../aggregates/database/database.aggregate';

export interface DatabaseRepository {
  findById(id: string): Promise<Database | null>;

  findByPageId(pageId: string): Promise<Database[]>;

  save(database: Database): Promise<void>;
}
