import type { AdminMarketplaceSaleSummary } from '../../ports/admin-marketplace-sales-reader.port';

export class AdminMarketplaceSaleListResponseDto {
  items: AdminMarketplaceSaleSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
