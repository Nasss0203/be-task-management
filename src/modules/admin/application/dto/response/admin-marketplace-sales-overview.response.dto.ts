import type { AdminMarketplaceSalesTotals } from '../../ports/admin-marketplace-sales-reader.port';

export class AdminMarketplaceSalesOverviewResponseDto {
  thisMonth: AdminMarketplaceSalesTotals;
  allTime: AdminMarketplaceSalesTotals;
  timeZone: string;
  currency: string;
}
