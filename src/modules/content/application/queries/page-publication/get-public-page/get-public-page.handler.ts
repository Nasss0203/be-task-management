import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PublicPageResponseDto } from 'src/modules/content/application/dto/page-publication/response/public-page.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';

import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PagePublicationRepository } from 'src/modules/content/domain/repositories/page-publication.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { PublishedSiteRepository } from 'src/modules/content/domain/repositories/published-site.repository';

import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import { GetPublicPageQuery } from './get-public-page.query';

@Injectable()
export class GetPublicPageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly publishedSiteRepository: PublishedSiteRepository,

    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly pagePublicationRepository: PagePublicationRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepository: PageBlockRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(query: GetPublicPageQuery): Promise<PublicPageResponseDto> {
    const site = await this.publishedSiteRepository.findActiveBySubdomain(
      query.subdomain,
    );

    if (!site) {
      throw new NotFoundException('Published site not found');
    }

    const publication =
      await this.pagePublicationRepository.findActiveBySiteAndPath(
        site.getId(),
        query.path,
      );

    if (!publication) {
      throw new NotFoundException('Published page not found');
    }

    const page = await this.pageRepository.findById(publication.getPageId());

    if (!page) {
      throw new NotFoundException('Published page not found');
    }

    const workspace = await this.workspaceRepository.findById(
      page.getWorkspaceId(),
    );

    if (!workspace) {
      throw new NotFoundException('Published page not found');
    }

    const blocks = await this.pageBlockRepository.findByPageId(page.getId());

    return PublicPageResponseDto.fromDomain(
      page,
      blocks,
      site.getSubdomain(),
      publication.getPath(),
    );
  }
}
