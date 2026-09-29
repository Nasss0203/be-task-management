import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { resolvePagePublication } from '../../../services/resolve-page-publication';

import { PublishSiteResponseDto } from 'src/modules/content/application/dto/page-publication/response/publish-site.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';

import type { PagePublicationRepository } from 'src/modules/content/domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from 'src/modules/content/domain/repositories/published-site.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { RepublishSiteCommand } from './republish-site.command';

@Injectable()
export class RepublishSiteHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly pagePublicationRepository: PagePublicationRepository,

    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly publishedSiteRepository: PublishedSiteRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    command: RepublishSiteCommand,
  ): Promise<PublishSiteResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const publication = await resolvePagePublication(
        this.pagePublicationRepository,
        command.pageId,
        command.siteId,
        manager,
      );
      if (!publication) {
        throw new NotFoundException('Page publication not found');
      }

      const site = await this.publishedSiteRepository.findById(
        publication.getSiteId(),
        manager,
      );

      if (!site) {
        throw new NotFoundException('Published site not found');
      }

      if (
        publication.getUnpublishedAt() === null &&
        (publication.getPath() !== '/' || site.getDisabledAt() === null)
      ) {
        throw new BadRequestException('Page is already published');
      }

      publication.republish(command.userId);
      if (
        publication.getPath() === '/' &&
        publication.getPageId() === site.getRootPageId()
      )
        site.enable();

      const savedPublication = await this.pagePublicationRepository.save(
        publication,
        manager,
      );

      const savedSite =
        publication.getPath() === '/'
          ? await this.publishedSiteRepository.save(site, manager)
          : site;

      return PublishSiteResponseDto.fromDomain(savedSite, savedPublication);
    });
  }
}
