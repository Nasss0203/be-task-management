import type { EntityManager } from 'typeorm';

export interface UnitOfWork {
  runInTransaction<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T>;
}
