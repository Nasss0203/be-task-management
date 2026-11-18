import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PublicationAvailabilityService } from 'src/modules/content/application/services/publication-availability.service';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PagePublicationRepository } from 'src/modules/content/domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from 'src/modules/content/domain/repositories/published-site.repository';

import { ADMIN_TYPES } from '../../../admin.types';
import type {
  AdminPublishedSitePageRow,
  AdminPublishedSiteReader,
  AdminPublishedSiteSummary,
} from '../../ports/admin-published-site-reader.port';

export type AdminPublishedPageNotLiveReason =
  | 'SITE_DISABLED'
  | 'UNPUBLISHED'
  | 'PAGE_IN_TRASH'
  | 'NOT_REACHABLE';

export interface AdminPublishedSitePage extends AdminPublishedSitePageRow {
  live: boolean;
  notLiveReason: AdminPublishedPageNotLiveReason | null;
}

export interface AdminPublishedSiteDetailResponse {
  site: AdminPublishedSiteSummary;
  pages: AdminPublishedSitePage[];
}

function notLiveReason(
  site: AdminPublishedSiteSummary,
  page: AdminPublishedSitePageRow,
): AdminPublishedPageNotLiveReason {
  if (site.disabledAt) {
    return 'SITE_DISABLED';
  }

  if (page.unpublishedAt) {
    return 'UNPUBLISHED';
  }

  if (page.pageDeletedAt) {
    return 'PAGE_IN_TRASH';
  }

  return 'NOT_REACHABLE';
}

@Injectable()
export class GetAdminPublishedSiteHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.PublishedSiteReader)
    private readonly siteReader: AdminPublishedSiteReader,

    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,

    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly publications: PagePublicationRepository,

    private readonly availability: PublicationAvailabilityService,
  ) {}

  async execute(siteId: string): Promise<AdminPublishedSiteDetailResponse> {
    const [detail, site, publications] = await Promise.all([
      this.siteReader.findSiteDetail(siteId),
      this.sites.findById(siteId),
      this.publications.findBySiteId(siteId),
    ]);

    if (!detail || !site) {
      throw new NotFoundException('Published site not found');
    }

    const publicationsById = new Map(
      publications.map((publication) => [publication.getId(), publication]),
    );

    const pages = await Promise.all(
      detail.pages.map(async (page) => {
        const publication = publicationsById.get(page.publicationId);
        const live = publication
          ? await this.availability.isAvailable(site, publication)
          : false;

        return {
          ...page,
          live,
          notLiveReason: live ? null : notLiveReason(detail.site, page),
        };
      }),
    );

    return { site: detail.site, pages };
  }
}
