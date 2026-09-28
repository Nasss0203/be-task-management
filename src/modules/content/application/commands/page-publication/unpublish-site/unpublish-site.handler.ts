import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import type { PagePublicationRepository } from 'src/modules/content/domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from 'src/modules/content/domain/repositories/published-site.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { UnpublishSiteResponseDto } from '../../../dto/page-publication/response/unpublish-site.response.dto';
import { UnpublishSiteCommand } from './unpublish-site.command';

@Injectable()
export class UnpublishSiteHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly pagePublicationRepository: PagePublicationRepository,

    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly publishedSiteRepository: PublishedSiteRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: UnpublishSiteCommand) {
    return this.uow.runInTransaction(async (manager) => {
      const publications = await this.pagePublicationRepository.findByPageId(
        command.pageId,
        manager,
      );

      if (publications.length === 0) {
        throw new NotFoundException('Page publication not found');
      }

      const publication = publications[0];

      const site = await this.publishedSiteRepository.findById(
        publication.getSiteId(),
        manager,
      );

      if (!site) {
        throw new NotFoundException('Published site not found');
      }

      if (publication.getUnpublishedAt() !== null) {
        throw new BadRequestException('Page is already unpublished');
      }

      const now = new Date();

      publication.unpublish(now);
      site.disable(now);

      const savedPublication = await this.pagePublicationRepository.save(
        publication,
        manager,
      );

      const savedSite = await this.publishedSiteRepository.save(site, manager);

      return UnpublishSiteResponseDto.fromDomain(savedSite, savedPublication);
    });
  }
}
