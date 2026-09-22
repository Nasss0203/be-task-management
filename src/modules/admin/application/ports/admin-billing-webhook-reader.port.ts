import type { BillingProvider } from 'src/modules/billing/domain/constants/billing-provider.constant';
import type { BillingWebhookStatus } from 'src/modules/billing/domain/constants/billing-webhook-status.constant';
import type { PaymentOrderStatus } from 'src/modules/billing/domain/constants/payment-order-status.constant';

export interface ListAdminBillingWebhookEventsInput {
  page: number;
  limit: number;
  search?: string;
  provider?: BillingProvider;
  status?: BillingWebhookStatus;
  eventType?: string;
}

export interface AdminBillingWebhookPaymentOrderSummary {
  id: string;
  orderCode: string;
  status: PaymentOrderStatus;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  plan: {
    id: string;
    code: string;
    name: string;
  };
}

export interface AdminBillingWebhookEventSummary {
  id: string;
  provider: BillingProvider;
  providerEventId: string;
  eventType: string;
  status: BillingWebhookStatus;
  paymentOrder: AdminBillingWebhookPaymentOrderSummary | null;
  processedAt: Date | null;
  createdAt: Date;
}

export interface ListAdminBillingWebhookEventsResult {
  items: AdminBillingWebhookEventSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminBillingWebhookReader {
  listWebhookEvents(
    input: ListAdminBillingWebhookEventsInput,
  ): Promise<ListAdminBillingWebhookEventsResult>;
}
