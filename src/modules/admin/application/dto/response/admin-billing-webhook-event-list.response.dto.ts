import type { AdminBillingWebhookEventSummary } from '../../ports/admin-billing-webhook-reader.port';

export class AdminBillingWebhookEventListResponseDto {
  items: AdminBillingWebhookEventSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
