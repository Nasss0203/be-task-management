import type { EntityManager } from 'typeorm';

/** Permission INSERTs are not protected by locks on existing permission rows.
 * Share/setting writers lock their Page before touching rows. Confirm holds
 * UPDATE on its target and SHARE on ancestors, so writes to either must wait.
 * Preserve the caller's UnitOfWork; standalone repository writes own a short
 * transaction instead of accidentally releasing the lock in autocommit. */
export async function withPagePermissionWriteLock<T>(
  manager: EntityManager,
  pageId: string,
  write: (manager: EntityManager) => Promise<T>,
): Promise<T> {
  if (!manager.queryRunner?.isTransactionActive) {
    return manager.transaction((transaction) =>
      withPagePermissionWriteLock(transaction, pageId, write),
    );
  }
  await manager.query('SELECT id FROM pages WHERE id = $1 FOR UPDATE', [
    pageId,
  ]);
  return write(manager);
}
