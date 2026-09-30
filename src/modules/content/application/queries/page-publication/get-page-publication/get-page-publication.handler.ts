import { Inject, Injectable } from '@nestjs/common';
import { resolvePagePublication } from '../../../services/resolve-page-publication';

import { GetPagePublicationResponseDto } from 'src/modules/content/application/dto/page-publication/response/get-page-publication.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';

import type { PagePublicationRepository } from 'src/modules/content/domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from 'src/modules/content/domain/repositories/published-site.repository';

import { GetPagePublicationQuery } from './get-page-publication.query';
import { PublicationAvailabilityService } from '../../../services/publication-availability.service';

@Injectable()
export class GetPagePublicationHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly pagePublicationRepository: PagePublicationRepository,

    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly publishedSiteRepository: PublishedSiteRepository,
    private readonly availability: PublicationAvailabilityService,
  ) {}

  async execute(
    query: GetPagePublicationQuery,
  ): Promise<GetPagePublicationResponseDto> {
    const publication = await resolvePagePublication(
      this.pagePublicationRepository,
      query.pageId,
      query.siteId,
    );
    if (!publication) {
      return {
        published: false,
      };
    }

    const site = await this.publishedSiteRepository.findById(
      publication.getSiteId(),
    );

    if (!site) {
      return {
        published: false,
      };
    }

    return {
      published: await this.availability.isAvailable(site, publication),

      site_id: site.getId(),
      page_id: publication.getPageId(),
      subdomain: site.getSubdomain(),
      path: publication.getPath(),
      published_at: publication.getPublishedAt(),
      unpublished_at: publication.getUnpublishedAt(),
    };
  }
}
