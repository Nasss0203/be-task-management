import type { TemplatePurchaseProvider } from 'src/modules/marketplace/domain/aggregates/template-purchase/template-purchase.aggregate';

export interface AdminMarketplaceSalesTotals {
  grossSales: number;
  platformRevenue: number;
  creatorEarnings: number;
  paidPurchases: number;
}

export interface AdminMarketplaceSalesOverview {
  thisMonth: AdminMarketplaceSalesTotals;
  allTime: AdminMarketplaceSalesTotals;
  timeZone: string;
  currency: string;
}

export interface ListAdminMarketplaceSalesInput {
  page: number;
  limit: number;
  search?: string;
}

export interface AdminMarketplaceSaleUser {
  id: string;
  email: string;
  username: string;
}

export interface AdminMarketplaceSaleSummary {
  id: string;
  orderCode: string;
  provider: TemplatePurchaseProvider | null;
  template: { id: string; name: string };
  buyer: AdminMarketplaceSaleUser;
  creator: AdminMarketplaceSaleUser;
  amount: number;
  commissionRateBps: number;
  platformFeeAmount: number;
  creatorEarnings: number;
  currency: string;
  paidAt: Date;
}

export interface ListAdminMarketplaceSalesResult {
  items: AdminMarketplaceSaleSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminMarketplaceSalesReader {
  getOverview(timeZone: string): Promise<AdminMarketplaceSalesOverview>;

  listSales(
    input: ListAdminMarketplaceSalesInput,
  ): Promise<ListAdminMarketplaceSalesResult>;
}
