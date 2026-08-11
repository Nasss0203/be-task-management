import {
  BillingProvider,
  SubscriptionStatus,
} from '../../domain/entities/subscription.entity';
import { PlanBillingInterval } from '../../domain/entities/plan.entity';

export class SubscriptionResponseDto {
  id: string;
  userId: string;
  planId: string;
  provider: BillingProvider;
  providerSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialEnd: Date | null;
  amount: number;
  currency: string;
  billingInterval: PlanBillingInterval;
  cancelAtPeriodEnd: boolean;
  cancelledAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;

  userEmail: string | null;
  username: string | null;
  planName: string | null;
  planSlug: string | null;
}
