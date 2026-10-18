import type { TemplatePurchaseStatus } from '../aggregates/template-purchase/template-purchase.aggregate';

/** One row of a buyer's own purchase history. */
export type TemplatePurchaseHistoryReadModel = {
  id: string;
  orderCode: string;
  templateId: string;
  // Hidden once the template is no longer public, like the claimed library.
  templateName: string | null;
  templateIcon: string | null;
  versionNumber: number | null;
  amount: number;
  currency: string;
  status: TemplatePurchaseStatus;
  createdAt: Date;
  paidAt: Date | null;
};

export type FindPurchaseHistoryFilters = {
  buyerId: string;
  limit: number;
  cursor?: { createdAt: Date; id: string };
};

export type FindPurchaseHistoryResult = {
  items: TemplatePurchaseHistoryReadModel[];
  hasNextPage: boolean;
};
