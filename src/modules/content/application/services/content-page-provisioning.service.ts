import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PublicSubdomainAllocatorService } from './public-subdomain-allocator.service';
import {
  PageBlock,
  PageBlockType,
} from 'src/modules/content/domain/entities/page-block.entity';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import {
  ContentPageProvisioningPort,
  CreateDefaultPageInput,
} from '../ports/content-page-provisioning.port';

@Injectable()
export class ContentPageProvisioningService implements ContentPageProvisioningPort {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly subdomains: PublicSubdomainAllocatorService,
  ) {}

  async createDefaultPage(
    input: CreateDefaultPageInput,
    context?: PersistenceContext,
  ): Promise<void> {
    const create = async (manager: PersistenceContext) => {
      await this.pageRepo.lockWorkspaceHierarchy(input.workspaceId, manager);
      const page = Page.create({
        workspaceId: input.workspaceId,
        title: input.title,
        createdBy: input.createdBy,
        slug: input.slug,
        publicSubdomain: await this.subdomains.allocate(
          input.slug ?? input.title,
          manager,
        ),
        isTemplate: input.isTemplate,
        icon: null,
        coverUrl: null,
      });

      const savedPage = await this.pageRepo.save(page, manager);

      const block = PageBlock.create({
        pageId: savedPage.getId(),
        type: PageBlockType.DATABASE_VIEW,
        title: savedPage.getTitle(),
        positionX: 0,
        positionY: 0,
        width: 12,
        height: 1,
        orderIndex: 0,
        createdBy: savedPage.getCreatedBy(),
        isOpen: true,
      });

      await this.pageBlockRepo.save(block, manager);
    };
    if (context === undefined) await this.uow.runInTransaction(create);
    else await create(context);
  }
}
