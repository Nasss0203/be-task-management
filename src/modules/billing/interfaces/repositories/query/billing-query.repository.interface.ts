import { Plan } from '../../../domain/entities/plan.entity';
import { SubscriptionWorkspace } from '../../../domain/entities/subscription-workspace.entity';
import { Subscription } from '../../../domain/entities/subscription.entity';
import { UsageLimit } from '../../../domain/entities/usage-limit.entity';

export interface BillingQueryRepository {
  existsWorkspaceMember(userId: string, workspaceId: string): Promise<boolean>;

  findActiveSubscription(userId: string): Promise<Subscription | null>;

  findPlanById(planId: string): Promise<Plan | null>;

  countSubscriptionWorkspaces(subscriptionId: string): Promise<number>;

  findUsageLimitsByWorkspaceId(workspaceId: string): Promise<UsageLimit[]>;
}
