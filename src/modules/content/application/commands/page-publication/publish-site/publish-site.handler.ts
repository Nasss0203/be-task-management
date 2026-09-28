import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { PagePublication } from 'src/modules/content/domain/entities/page-publication.entity';
import { PublishedSite } from 'src/modules/content/domain/entities/published-site.entity';

import type { PagePublicationRepository } from 'src/modules/content/domain/repositories/page-publication.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { PublishedSiteRepository } from 'src/modules/content/domain/repositories/published-site.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PublishSiteResponseDto } from '../../../dto/page-publication/response/publish-site.response.dto';
import { PublishSiteCommand } from './publish-site.command';

@Injectable()
export class PublishSiteHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly publishedSiteRepository: PublishedSiteRepository,

    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly pagePublicationRepository: PagePublicationRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: PublishSiteCommand) {
    return this.uow.runInTransaction(async (manager) => {
      const page = await this.pageRepository.findById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      const existingSite = await this.publishedSiteRepository.findByRootPageId(
        page.getId(),
        manager,
      );

      if (existingSite) {
        throw new BadRequestException('Page is already published as a site');
      }

      const subdomainExists =
        await this.publishedSiteRepository.existsBySubdomain(
          command.subdomain,
          manager,
        );

      if (subdomainExists) {
        throw new BadRequestException('Subdomain is already in use');
      }

      const site = PublishedSite.create({
        workspaceId: page.getWorkspaceId(),
        rootPageId: page.getId(),
        subdomain: command.subdomain,
        createdBy: command.userId,
      });

      const publication = PagePublication.create({
        siteId: site.getId(),
        pageId: page.getId(),
        path: '/',
        publishedBy: command.userId,
      });

      const savedSite = await this.publishedSiteRepository.save(site, manager);

      const savedPublication = await this.pagePublicationRepository.save(
        publication,
        manager,
      );

      return PublishSiteResponseDto.fromDomain(savedSite, savedPublication);
    });
  }
}
