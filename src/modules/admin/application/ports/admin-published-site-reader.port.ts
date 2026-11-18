import type { PagePublicationType } from 'src/modules/content/domain/enums/page-publication-type.enum';

export enum AdminPublishedSiteStatusFilter {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  ALL = 'ALL',
}

export interface AdminPublishedSitesOverview {
  sites: number;
  active: number;
  disabled: number;
  publicPages: number;
}

export interface ListAdminPublishedSitesInput {
  page: number;
  limit: number;
  search?: string;
  status: AdminPublishedSiteStatusFilter;
}

export interface AdminPublishedSiteSummary {
  id: string;
  subdomain: string;
  url: string | null;
  rootPage: { id: string; title: string };
  workspace: { id: string; name: string };
  creator: { id: string; email: string; username: string };
  allowUpdates: boolean;
  publicPages: number;
  lastPublishedAt: Date | null;
  createdAt: Date;
  disabledAt: Date | null;
}

export interface AdminPublishedSitePageRow {
  publicationId: string;
  pageId: string;
  title: string;
  path: string;
  publicationType: PagePublicationType;
  includeDescendants: boolean;
  pageDeletedAt: Date | null;
  publishedBy: { id: string; email: string; username: string };
  publishedAt: Date;
  unpublishedAt: Date | null;
}

export interface AdminPublishedSiteDetail {
  site: AdminPublishedSiteSummary;
  pages: AdminPublishedSitePageRow[];
}

export interface ListAdminPublishedSitesResult {
  items: AdminPublishedSiteSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminPublishedSiteReader {
  getOverview(): Promise<AdminPublishedSitesOverview>;

  listSites(
    input: ListAdminPublishedSitesInput,
  ): Promise<ListAdminPublishedSitesResult>;

  findSiteDetail(siteId: string): Promise<AdminPublishedSiteDetail | null>;
}
