import { AdminPublishedSiteStatusFilter } from '../../ports/admin-published-site-reader.port';

export class ListAdminPublishedSitesQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly status: AdminPublishedSiteStatusFilter = AdminPublishedSiteStatusFilter.ALL,
  ) {}
}
