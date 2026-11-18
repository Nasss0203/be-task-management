import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminPublishedSiteListResponseDto } from '../../dto/response/admin-published-site-list.response.dto';
import type { AdminPublishedSiteReader } from '../../ports/admin-published-site-reader.port';
import { ListAdminPublishedSitesQuery } from './list-admin-published-sites.query';

@Injectable()
export class ListAdminPublishedSitesHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.PublishedSiteReader)
    private readonly siteReader: AdminPublishedSiteReader,
  ) {}

  async execute(
    query: ListAdminPublishedSitesQuery,
  ): Promise<AdminPublishedSiteListResponseDto> {
    const result = await this.siteReader.listSites({
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
    });

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages:
        result.total === 0 ? 0 : Math.ceil(result.total / result.limit),
    };
  }
}
