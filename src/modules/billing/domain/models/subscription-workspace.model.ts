import { SubscriptionStatus } from '../entities/subscription.entity';

export class SubscriptionWorkspaceModel {
  constructor(
    public readonly id: string,
    public readonly subscriptionId: string,
    public readonly workspaceId: string,
    public readonly activatedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly subscriptionStatus: SubscriptionStatus | null = null,
    public readonly subscriptionPlanId: string | null = null,
    public readonly workspaceName: string | null = null,
    public readonly workspaceSlug: string | null = null,
  ) {}
}
