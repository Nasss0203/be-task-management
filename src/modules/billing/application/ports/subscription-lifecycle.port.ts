import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface SubscriptionLifecyclePort {
  handleBillingContactLeft(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void>;

  handleWorkspaceDeleted(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<void>;
}
