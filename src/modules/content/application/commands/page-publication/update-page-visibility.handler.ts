import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CONTENT_TYPES } from '../../../content.types';
import type { PageRepository } from '../../../domain/repositories/page.repository';
import type { PagePublicationRepository } from '../../../domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from '../../../domain/repositories/published-site.repository';
import { PagePublicationType } from '../../../domain/enums/page-publication-type.enum';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PagePublicationResponseDto } from '../../dto/page-publication/response/page-publication.response.dto';
import { PagePublicationTreeService } from '../../services/page-publication-tree.service';
import { PublicationAvailabilityService } from '../../services/publication-availability.service';

@Injectable()
export class UpdatePageVisibilityHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pages: PageRepository,
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
    pageId: string,
    published: boolean,
    actorId: string,
  ): Promise<PagePublicationResponseDto> {
    const result = await this.uow.runInTransaction(async (context) => {
      let page = await this.pages.findById(pageId, context);
      if (!page || page.getDeletedAt() !== null)
        throw new NotFoundException('Page not found');
      await this.tree.lockWorkspace(page.getWorkspaceId(), context);
      page = await this.pages.findById(pageId, context);
      if (!page || page.getDeletedAt() !== null)
        throw new NotFoundException('Page not found');
      if (!page.getParentPageId())
        throw new ConflictException('Use site publication for root pages');
      let root = page;
      while (root.getParentPageId()) {
        const parent = await this.pages.findById(
          root.getParentPageId()!,
          context,
        );
        if (!parent || parent.getDeletedAt() !== null)
          throw new NotFoundException('Page ancestor not found');
        root = parent;
      }
      if (!root.getPublicSubdomain())
        throw new NotFoundException('Published site not found');
      const candidate = await this.sites.findBySubdomain(
        root.getPublicSubdomain()!,
        context,
      );
      if (!candidate) throw new NotFoundException('Published site not found');
      const site = await this.sites.findByIdForUpdate(
        candidate.getId(),
        context,
      );
      if (
        !site ||
        site.getRootPageId() !== root.getId() ||
        site.getDisabledAt() !== null
      )
        throw new ConflictException('Root site is not published');
      const rootPublication = await this.publications.findBySiteAndPage(
        site.getId(),
        root.getId(),
        context,
      );
      if (!rootPublication || rootPublication.getUnpublishedAt() !== null)
        throw new ConflictException('Root site is not published');

      // Provision a path for pages created while the root default was off.
      await this.tree.executePlan(
        await this.tree.buildSiteReconciliationPlan(
          site,
          rootPublication,
          actorId,
          context,
        ),
        context,
      );
      const child = await this.publications.findBySiteAndPage(
        site.getId(),
        pageId,
        context,
      );
      if (
        !child ||
        child.getPublicationType() !== PagePublicationType.INHERITED
      )
        throw new ConflictException('Child publication is unavailable');
      child.updateVisibilityOverride(published ? 'PUBLISHED' : 'UNPUBLISHED');
      await this.publications.save(child, context);
      await this.tree.executePlan(
        await this.tree.buildSiteReconciliationPlan(
          site,
          rootPublication,
          actorId,
          context,
        ),
        context,
      );
      const current = await this.publications.findBySiteAndPage(
        site.getId(),
        pageId,
        context,
      );
      if (!current) throw new NotFoundException('Page publication not found');
      return { site, publication: current };
    });
    return PagePublicationResponseDto.fromDomain(
      result.publication,
      result.site,
      await this.availability.isAvailable(result.site, result.publication),
    );
  }
}
