import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

/** Locks the Page context until the caller's transaction ends. */
export interface AiPageContextTransactionLocker {
  lock(pageId: string, context: PersistenceContext, userId: string): Promise<void>;
}
