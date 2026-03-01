export interface UnitOfWork {
  runInTransaction<T>(fn: () => Promise<T>): Promise<T>;
}
