import type { BillingInterval } from 'src/modules/billing/domain/constants/billing-interval.constant';
import type { BillingProvider } from 'src/modules/billing/domain/constants/billing-provider.constant';

export class ListAdminBillingPlansQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly isActive?: boolean,
    public readonly isPublic?: boolean,
    public readonly provider?: BillingProvider,
    public readonly billingInterval?: BillingInterval,
  ) {}
}
