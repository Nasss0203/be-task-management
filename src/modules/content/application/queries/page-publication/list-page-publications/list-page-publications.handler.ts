import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from '../../../../content.types';
import type { PagePublicationRepository } from '../../../../domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from '../../../../domain/repositories/published-site.repository';
import type { PageRepository } from '../../../../domain/repositories/page.repository';
import { PagePublicationResponseDto } from '../../../dto/page-publication/response/page-publication.response.dto';
import { PublicationAvailabilityService } from '../../../services/publication-availability.service';

@Injectable()
export class ListPagePublicationsHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly publications: PagePublicationRepository,
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pages: PageRepository,
    private readonly availability: PublicationAvailabilityService,
  ) {}

  async execute(pageId: string): Promise<PagePublicationResponseDto[]> {
    const result: PagePublicationResponseDto[] = [];
    let root = await this.pages.findById(pageId);
    if (!root || root.getDeletedAt() !== null) return result;
    while (root.getParentPageId()) {
      root = await this.pages.findById(root.getParentPageId()!);
      if (!root || root.getDeletedAt() !== null) return result;
    }
    const subdomain = root.getPublicSubdomain();
    if (!subdomain) return result;
    for (const publication of await this.publications.findByPageId(pageId)) {
      const site = await this.sites.findById(publication.getSiteId());
      if (
        site &&
        site.getRootPageId() === root.getId() &&
        site.getSubdomain() === subdomain
      )
        result.push(
          PagePublicationResponseDto.fromDomain(
            publication,
            site,
            await this.availability.isAvailable(site, publication),
          ),
        );
    }
    return result;
  }
}
