import type { BillingProvider } from 'src/modules/billing/domain/constants/billing-provider.constant';
import type { SubscriptionStatus } from 'src/modules/billing/domain/constants/subscription-status.constant';

export class ListAdminBillingSubscriptionsQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly status?: SubscriptionStatus,
    public readonly provider?: BillingProvider,
    public readonly planCode?: string,
  ) {}
}
