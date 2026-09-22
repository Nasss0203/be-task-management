import type { BillingProvider } from 'src/modules/billing/domain/constants/billing-provider.constant';
import type { BillingWebhookStatus } from 'src/modules/billing/domain/constants/billing-webhook-status.constant';

export class ListAdminBillingWebhookEventsQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly provider?: BillingProvider,
    public readonly status?: BillingWebhookStatus,
    public readonly eventType?: string,
  ) {}
}
