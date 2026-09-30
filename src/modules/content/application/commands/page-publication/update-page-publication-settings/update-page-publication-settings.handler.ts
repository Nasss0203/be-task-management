import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CONTENT_TYPES } from '../../../../content.types';
import { PagePublication } from '../../../../domain/entities/page-publication.entity';
import { PagePublicationType } from '../../../../domain/enums/page-publication-type.enum';
import type { PagePublicationRepository } from '../../../../domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from '../../../../domain/repositories/published-site.repository';
import { PagePublicationResponseDto } from '../../../dto/page-publication/response/page-publication.response.dto';
import { PagePublicationTreeService } from '../../../services/page-publication-tree.service';
import { PublicationAvailabilityService } from '../../../services/publication-availability.service';
import { resolvePagePublication } from '../../../services/resolve-page-publication';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { UpdatePagePublicationSettingsCommand } from './update-page-publication-settings.command';

@Injectable()
export class UpdatePagePublicationSettingsHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly publications: PagePublicationRepository,
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly tree: PagePublicationTreeService,
    private readonly availability: PublicationAvailabilityService,
  ) {}

  async execute(
    command: UpdatePagePublicationSettingsCommand,
  ): Promise<PagePublicationResponseDto> {
    const { site, publication } = await this.uow.runInTransaction(
      async (manager) => {
        let publication = await resolvePagePublication(
          this.publications,
          command.pageId,
          command.siteId,
          manager,
        );
        if (!publication)
          throw new NotFoundException('Page publication not found');

        const candidateSite = await this.sites.findById(
          publication.getSiteId(),
          manager,
        );
        if (!candidateSite)
          throw new NotFoundException('Published site not found');
        await this.tree.lockWorkspace(candidateSite.getWorkspaceId(), manager);

        // Resolution can become ambiguous while waiting for the workspace lock.
        publication = await resolvePagePublication(
          this.publications,
          command.pageId,
          command.siteId,
          manager,
        );
        if (!publication)
          throw new NotFoundException('Page publication not found');
        const site = await this.sites.findByIdForUpdate(
          publication.getSiteId(),
          manager,
        );
        if (!site) throw new NotFoundException('Published site not found');

        publication = await this.publications.findBySiteAndPage(
          site.getId(),
          command.pageId,
          manager,
        );
        if (!publication)
          throw new NotFoundException('Page publication not found');
        if (publication.getPublicationType() === PagePublicationType.INHERITED)
          throw new ConflictException(
            'Inherited publication settings are managed by its publishing ancestor',
          );
        if (site.getDisabledAt() !== null)
          throw new BadRequestException('Published site is disabled');
        if (publication.getUnpublishedAt() !== null)
          throw new BadRequestException('Page publication is unpublished');

        // Work on a copy so a failed plan does not mutate repository-owned state.
        const updated = PagePublication.restore({
          id: publication.getId(),
          siteId: publication.getSiteId(),
          pageId: publication.getPageId(),
          path: publication.getPath(),
          parentPublicationId: publication.getParentPublicationId(),
          publicationType: publication.getPublicationType(),
          includeDescendants: publication.getIncludeDescendants(),
          publishedBy: publication.getPublishedBy(),
          publishedAt: publication.getPublishedAt(),
          unpublishedAt: publication.getUnpublishedAt(),
          updatedAt: publication.getUpdatedAt(),
        });
        updated.updateIncludeDescendants(command.includeDescendants);

        if (command.includeDescendants) {
          const plan = await this.tree.buildPlan(
            site,
            updated,
            command.actorId,
            manager,
          );
          await this.tree.executePlan(plan, manager);
        } else {
          // Traverse while the old setting still enables inheritance.
          if (publication.getIncludeDescendants())
            await this.tree.unpublishBranch(publication, manager, new Date());
          await this.publications.save(updated, manager);
        }

        return { site, publication: updated };
      },
    );
    return PagePublicationResponseDto.fromDomain(
      publication,
      site,
      await this.availability.isAvailable(site, publication),
    );
  }
}
