import {
  BillingProvider,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { PlanBillingInterval } from '../entities/plan.entity';

export class SubscriptionModel {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly planId: string,
    public readonly provider: BillingProvider,
    public readonly providerSubscriptionId: string | null,
    public readonly status: SubscriptionStatus,
    public readonly currentPeriodStart: Date | null,
    public readonly currentPeriodEnd: Date | null,
    public readonly trialEnd: Date | null,
    public readonly amount: number,
    public readonly currency: string,
    public readonly billingInterval: PlanBillingInterval,
    public readonly cancelAtPeriodEnd: boolean,
    public readonly cancelledAt: Date | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly userEmail: string | null = null,
    public readonly username: string | null = null,
    public readonly planName: string | null = null,
    public readonly planSlug: string | null = null,
  ) {}
}
