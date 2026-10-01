import {
    BadRequestException,
    ConflictException,
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
import { PagePublicationTreeService } from '../../../services/page-publication-tree.service';
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
    private readonly publicationTree: PagePublicationTreeService,
  ) {}

  async execute(command: PublishSiteCommand) {
    return this.uow.runInTransaction(async (manager) => {
      let page = await this.pageRepository.findById(command.pageId, manager);

      if (!page) throw new NotFoundException('Page not found');
      await this.pageRepository.lockWorkspaceHierarchy(
        page.getWorkspaceId(),
        manager,
      );
      page = await this.pageRepository.findById(command.pageId, manager);

      if (!page || page.getDeletedAt() !== null) {
        throw new NotFoundException('Page not found');
      }

      if (page.getParentPageId() !== null)
        throw new ConflictException(
          'Child pages inherit the public site from their root page',
        );
      const subdomain = page.getPublicSubdomain();
      if (!subdomain)
        throw new ConflictException(
          'Root page has no reserved public subdomain',
        );
      if (
        command.subdomain !== undefined &&
        command.subdomain.trim().toLowerCase() !== subdomain
      )
        throw new BadRequestException(
          'Requested subdomain differs from the reserved page subdomain',
        );

      const existingSite = await this.publishedSiteRepository.findBySubdomain(
        subdomain,
        manager,
      );
      if (existingSite) {
        if (existingSite.getRootPageId() !== page.getId())
          throw new ConflictException(
            'Reserved subdomain belongs to another site',
          );
        const site = await this.publishedSiteRepository.findByIdForUpdate(
          existingSite.getId(),
          manager,
        );
        if (!site) throw new NotFoundException('Published site not found');
        const root = await this.pagePublicationRepository.findBySiteAndPage(
          site.getId(),
          page.getId(),
          manager,
        );
        if (!root || root.getPath() !== '/')
          throw new ConflictException('Published site has no root publication');
        if (site.getDisabledAt() === null && root.getUnpublishedAt() === null)
          throw new BadRequestException('Page is already published');
        root.republish(command.userId);
        root.updateIncludeDescendants(command.includeDescendants);
        site.enable();
        const plan = await this.publicationTree.buildSiteReconciliationPlan(
          site,
          root,
          command.userId,
          manager,
        );
        await this.publicationTree.executePlan(plan, manager);
        const savedSite = await this.publishedSiteRepository.save(
          site,
          manager,
        );
        return PublishSiteResponseDto.fromDomain(savedSite, root);
      }

      const site = PublishedSite.create({
        workspaceId: page.getWorkspaceId(),
        rootPageId: page.getId(),
        subdomain,
        createdBy: command.userId,
      });

      const publication = PagePublication.create({
        siteId: site.getId(),
        pageId: page.getId(),
        path: '/',
        includeDescendants: command.includeDescendants,
        publishedBy: command.userId,
      });

      const plan = await this.publicationTree.buildPlan(
        site,
        publication,
        command.userId,
        manager,
      );
      const savedSite = await this.publishedSiteRepository.save(site, manager);

      await this.publicationTree.executePlan(plan, manager);

      return PublishSiteResponseDto.fromDomain(savedSite, publication);
    });
  }
}
