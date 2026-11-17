import type { TemplateListingStatus } from 'src/modules/marketplace/domain/enums/template-listing-status.enum';
import type { TemplateOfferType } from 'src/modules/marketplace/domain/enums/template-offer-type.enum';

export enum AdminTemplateStatusFilter {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  ALL = 'ALL',
}

export enum AdminTemplateOfferFilter {
  FREE = 'FREE',
  PAID = 'PAID',
  ALL = 'ALL',
}

export interface AdminTemplatesOverview {
  listings: number;
  published: number;
  draft: number;
  paid: number;
  free: number;
  grossSales: number;
  currency: string;
}

export interface ListAdminTemplatesInput {
  page: number;
  limit: number;
  search?: string;
  status: AdminTemplateStatusFilter;
  offerType: AdminTemplateOfferFilter;
  categoryId?: string;
}

export interface AdminTemplateListingStats {
  likes: number;
  reviews: number;
  averageRating: number | null;
  paidPurchases: number;
  grossSales: number;
}

export interface AdminTemplateListingSummary {
  listingId: string;
  template: { id: string; name: string; coverUrl: string | null };
  creator: { id: string; email: string; username: string };
  workspace: { id: string; name: string };
  status: TemplateListingStatus;
  offerType: TemplateOfferType;
  priceAmount: number;
  currency: string;
  categories: Array<{ id: string; name: string }>;
  stats: AdminTemplateListingStats;
  publishedAt: Date | null;
  updatedAt: Date;
}

export interface ListAdminTemplatesResult {
  items: AdminTemplateListingSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminTemplateReader {
  getOverview(): Promise<AdminTemplatesOverview>;

  listTemplates(
    input: ListAdminTemplatesInput,
  ): Promise<ListAdminTemplatesResult>;
}
