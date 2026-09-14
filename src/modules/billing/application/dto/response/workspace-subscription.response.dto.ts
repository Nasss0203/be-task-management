import { BillingProvider } from '../../../domain/constants/billing-provider.constant';
import { SubscriptionStatus } from '../../../domain/constants/subscription-status.constant';

export class WorkspaceSubscriptionPlanResponseDto {
  id: string;

  code: string;

  name: string;
}

export class WorkspaceSubscriptionResponseDto {
  subscriptionId: string | null;

  workspaceId: string;

  plan: WorkspaceSubscriptionPlanResponseDto;

  planPriceId: string | null;

  provider: BillingProvider | null;

  status: SubscriptionStatus;

  currentPeriodStart: Date | null;

  currentPeriodEnd: Date | null;

  cancelAtPeriodEnd: boolean;
}
