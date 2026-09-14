import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { WorkspaceSubscription } from '../entities/workspace-subscription.entity';

export interface WorkspaceSubscriptionRepository {
  save(
    subscription: WorkspaceSubscription,
    context?: PersistenceContext,
  ): Promise<WorkspaceSubscription>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceSubscription | null>;

  findByWorkspaceId(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceSubscription | null>;
}
