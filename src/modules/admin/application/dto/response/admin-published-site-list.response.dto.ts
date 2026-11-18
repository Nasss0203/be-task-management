import type { AdminPublishedSiteSummary } from '../../ports/admin-published-site-reader.port';

export class AdminPublishedSiteListResponseDto {
  items: AdminPublishedSiteSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
