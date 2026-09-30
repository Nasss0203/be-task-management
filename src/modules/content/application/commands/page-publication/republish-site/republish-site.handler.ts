import {
  BadRequestException,
  ConflictException,
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
import { PagePublicationTreeService } from '../../../services/page-publication-tree.service';
import { PagePublicationType } from '../../../../domain/enums/page-publication-type.enum';

@Injectable()
export class RepublishSiteHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly pagePublicationRepository: PagePublicationRepository,

    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly publishedSiteRepository: PublishedSiteRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly publicationTree: PagePublicationTreeService,
  ) {}

  async execute(
    command: RepublishSiteCommand,
  ): Promise<PublishSiteResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      let publication = await resolvePagePublication(
        this.pagePublicationRepository,
        command.pageId,
        command.siteId,
        manager,
      );
      if (!publication) {
        throw new NotFoundException('Page publication not found');
      }

      const candidateSite = await this.publishedSiteRepository.findById(
        publication.getSiteId(),
        manager,
      );
      if (!candidateSite)
        throw new NotFoundException('Published site not found');
      await this.publicationTree.lockWorkspace(
        candidateSite.getWorkspaceId(),
        manager,
      );
      // A new site may have been published while this request waited for the workspace lock.
      publication = await resolvePagePublication(
        this.pagePublicationRepository,
        command.pageId,
        command.siteId,
        manager,
      );
      if (!publication)
        throw new NotFoundException('Page publication not found');
      const site = await this.publishedSiteRepository.findByIdForUpdate(
        publication.getSiteId(),
        manager,
      );

      if (!site) {
        throw new NotFoundException('Published site not found');
      }

      publication = await this.pagePublicationRepository.findBySiteAndPage(
        site.getId(),
        command.pageId,
        manager,
      );
      if (!publication)
        throw new NotFoundException('Page publication not found');
      if (publication.getPublicationType() === PagePublicationType.INHERITED) {
        throw new ConflictException(
          'Inherited publication cannot be republished independently; republish its publishing ancestor',
        );
      }

      if (
        publication.getUnpublishedAt() === null &&
        (publication.getPath() !== '/' || site.getDisabledAt() === null)
      ) {
        throw new BadRequestException('Page is already published');
      }

      if (publication.getPath() !== '/' && site.getDisabledAt() !== null) {
        throw new BadRequestException(
          'Published site is disabled; republish the root first',
        );
      }
      publication.republish(command.userId);
      if (
        publication.getPath() === '/' &&
        publication.getPageId() === site.getRootPageId()
      )
        site.enable();

      const plan =
        publication.getPath() === '/'
          ? await this.publicationTree.buildSiteReconciliationPlan(
              site,
              publication,
              command.userId,
              manager,
            )
          : await this.publicationTree.buildPlan(
              site,
              publication,
              command.userId,
              manager,
            );
      await this.publicationTree.executePlan(plan, manager);

      const savedSite =
        publication.getPath() === '/'
          ? await this.publishedSiteRepository.save(site, manager)
          : site;

      return PublishSiteResponseDto.fromDomain(savedSite, publication);
    });
  }
}
