import type { AdminBillingSubscriptionSummary } from '../../ports/admin-billing-reader.port';

export class AdminBillingSubscriptionListResponseDto {
  items: AdminBillingSubscriptionSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
