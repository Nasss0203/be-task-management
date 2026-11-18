import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import type {
  AdminPublishedSiteReader,
  AdminPublishedSitesOverview,
} from '../../ports/admin-published-site-reader.port';

@Injectable()
export class GetAdminPublishedSitesOverviewHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.PublishedSiteReader)
    private readonly siteReader: AdminPublishedSiteReader,
  ) {}

  execute(): Promise<AdminPublishedSitesOverview> {
    return this.siteReader.getOverview();
  }
}
