import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from '../../../../content.types';
import type { PagePublicationRepository } from '../../../../domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from '../../../../domain/repositories/published-site.repository';
import { PagePublicationResponseDto } from '../../../dto/page-publication/response/page-publication.response.dto';
import { PublicationAvailabilityService } from '../../../services/publication-availability.service';

@Injectable()
export class ListPagePublicationsHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly publications: PagePublicationRepository,
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,
    private readonly availability: PublicationAvailabilityService,
  ) {}

  async execute(pageId: string): Promise<PagePublicationResponseDto[]> {
    const result: PagePublicationResponseDto[] = [];
    for (const publication of await this.publications.findByPageId(pageId)) {
      const site = await this.sites.findById(publication.getSiteId());
      if (site)
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
