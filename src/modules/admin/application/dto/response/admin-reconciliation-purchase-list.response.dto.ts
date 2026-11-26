import type { AdminReconciliationPurchase } from '../../ports/admin-marketplace-sales-reader.port';

export class AdminReconciliationPurchaseListResponseDto {
  items: AdminReconciliationPurchase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
