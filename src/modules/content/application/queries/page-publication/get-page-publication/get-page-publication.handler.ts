import { Inject, Injectable } from '@nestjs/common';

import { GetPagePublicationResponseDto } from 'src/modules/content/application/dto/page-publication/response/get-page-publication.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';

import type { PagePublicationRepository } from 'src/modules/content/domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from 'src/modules/content/domain/repositories/published-site.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { GetPagePublicationQuery } from './get-page-publication.query';
import { PublicationAvailabilityService } from '../../../services/publication-availability.service';

@Injectable()
export class GetPagePublicationHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly pagePublicationRepository: PagePublicationRepository,

    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly publishedSiteRepository: PublishedSiteRepository,
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pages: PageRepository,
    private readonly availability: PublicationAvailabilityService,
  ) {}

  async execute(
    query: GetPagePublicationQuery,
  ): Promise<GetPagePublicationResponseDto> {
    let root = await this.pages.findById(query.pageId);
    if (!root || root.getDeletedAt() !== null) return { published: false };
    while (root.getParentPageId()) {
      root = await this.pages.findById(root.getParentPageId()!);
      if (!root || root.getDeletedAt() !== null) return { published: false };
    }
    if (!root.getPublicSubdomain()) return { published: false };
    const site = await this.publishedSiteRepository.findBySubdomain(
      root.getPublicSubdomain()!,
    );
    if (
      !site ||
      site.getRootPageId() !== root.getId() ||
      (query.siteId && query.siteId !== site.getId())
    )
      return { published: false };
    const publication = await this.pagePublicationRepository.findBySiteAndPage(
      site.getId(),
      query.pageId,
    );

    return {
      published: publication
        ? await this.availability.isAvailable(site, publication)
        : false,

      site_id: site.getId(),
      page_id: query.pageId,
      subdomain: site.getSubdomain(),
      site_active: site.getDisabledAt() === null,
      path: publication?.getPath(),
      published_at: publication?.getPublishedAt(),
      unpublished_at: publication?.getUnpublishedAt(),
    };
  }
}
