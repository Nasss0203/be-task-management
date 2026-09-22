import type { AdminBillingPaymentOrderSummary } from '../../ports/admin-billing-reader.port';

export class AdminBillingPaymentOrderListResponseDto {
  items: AdminBillingPaymentOrderSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
