import { PersistenceContext } from './persistence-context';

export interface UnitOfWork {
  runInTransaction<T>(
    fn: (context: PersistenceContext) => Promise<T>,
  ): Promise<T>;
}
