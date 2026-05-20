import { SubscriptionStatus } from '../../domain/entities/subscription.entity';

export class SubscriptionWorkspaceResponseDto {
  id: string;
  subscriptionId: string;
  workspaceId: string;
  activatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  subscriptionStatus: SubscriptionStatus | null;
  subscriptionPlanId: string | null;
  workspaceName: string | null;
  workspaceSlug: string | null;
}
