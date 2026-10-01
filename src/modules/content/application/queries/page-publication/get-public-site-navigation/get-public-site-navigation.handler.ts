import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CONTENT_TYPES } from '../../../../content.types';
import type { PublishedSiteRepository } from '../../../../domain/repositories/published-site.repository';
import type {
  PublicSiteNavigationReader,
  PublicSiteNavigationRow,
} from '../../../ports/public-site-navigation-reader.port';
import {
  PublicSiteNavigationPageResponseDto,
  PublicSiteNavigationResponseDto,
} from '../../../dto/page-publication/response/public-site-navigation.response.dto';
import { GetPublicSiteNavigationQuery } from './get-public-site-navigation.query';

@Injectable()
export class GetPublicSiteNavigationHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,
    @Inject(CONTENT_TYPES.ports.PublicSiteNavigationReader)
    private readonly reader: PublicSiteNavigationReader,
  ) {}

  async execute(
    query: GetPublicSiteNavigationQuery,
  ): Promise<PublicSiteNavigationResponseDto> {
    const site = await this.sites.findActiveBySubdomain(query.subdomain);
    if (!site) throw new NotFoundException('Published site not found');

    const rows = await this.reader.listBySiteId(site.getId());
    const root = rows.find(
      (row) => row.path === '/' && row.parentPublicationId === null,
    );
    if (!root || root.unpublishedAt !== null) {
      throw new NotFoundException('Published site not found');
    }

    const byPublicationId = new Map(
      rows.map((row) => [row.publicationId, row]),
    );
    const visible = rows.filter((row) => row.unpublishedAt === null);
    const visibleIds = new Set(visible.map((row) => row.publicationId));

    const pages = visible.map((row) => {
      const parentId = this.findNearestVisibleParent(
        row,
        byPublicationId,
        visibleIds,
        root.pageId,
      );
      const page = new PublicSiteNavigationPageResponseDto();
      page.page_id = row.pageId;
      page.title = row.title;
      page.icon = row.icon;
      page.path = row.path;
      page.navigation_parent_id = parentId;
      return page;
    });

    return { subdomain: site.getSubdomain(), pages };
  }

  private findNearestVisibleParent(
    row: PublicSiteNavigationRow,
    byPublicationId: Map<string, PublicSiteNavigationRow>,
    visibleIds: Set<string>,
    rootPageId: string,
  ): string | null {
    if (row.path === '/') return null;

    const visited = new Set<string>();
    let parentId = row.parentPublicationId;
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = byPublicationId.get(parentId);
      if (!parent) break;
      if (visibleIds.has(parent.publicationId)) return parent.pageId;
      parentId = parent.parentPublicationId;
    }

    return rootPageId;
  }
}
