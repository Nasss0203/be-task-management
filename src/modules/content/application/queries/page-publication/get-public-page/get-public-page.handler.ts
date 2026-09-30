import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CONTENT_TYPES } from '../../../../content.types';
import type { PageBlockRepository } from '../../../../domain/repositories/page-block.repository';
import type { PagePublicationRepository } from '../../../../domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from '../../../../domain/repositories/published-site.repository';
import { PublicPageResponseDto } from '../../../dto/page-publication/response/public-page.response.dto';
import { PublicationAvailabilityService } from '../../../services/publication-availability.service';
import { GetPublicPageQuery } from './get-public-page.query';

@Injectable()
export class GetPublicPageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly publications: PagePublicationRepository,
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly blocks: PageBlockRepository,
    private readonly availability: PublicationAvailabilityService,
  ) {}

  async execute(query: GetPublicPageQuery): Promise<PublicPageResponseDto> {
    try {
      const site = await this.sites.findActiveBySubdomain(query.subdomain);
      if (!site) throw new NotFoundException('Published site not found');
      const publication = await this.publications.findActiveBySiteAndPath(
        site.getId(),
        query.path,
      );
      if (!publication) throw new NotFoundException('Published page not found');
      const resolved = await this.availability.resolve(site, publication);
      if (!resolved) throw new NotFoundException('Published page not found');
      const result = PublicPageResponseDto.fromDomain(
        resolved.page,
        await this.blocks.findByPageId(resolved.page.getId()),
        site.getSubdomain(),
        publication.getPath(),
      );
      result.breadcrumbs = resolved.breadcrumbs;
      return result;
    } catch (error) {
      // Invalid stored shapes must not render a partial public tree.
      if (error instanceof BadRequestException)
        throw new NotFoundException('Published page not found');
      throw error;
    }
  }
}
