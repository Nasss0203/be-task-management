import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { PageBlock, PageBlockType } from 'src/modules/content/domain/entities/page-block.entity';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { ContentPageProvisioningPort, CreateDefaultPageInput } from '../ports/content-page-provisioning.port';

@Injectable()
export class ContentPageProvisioningService implements ContentPageProvisioningPort {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
    
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
  ) {}

  async createDefaultPage(
    input: CreateDefaultPageInput,
    context?: PersistenceContext,
  ): Promise<void> {
    const page = Page.create({
      workspaceId: input.workspaceId,
      title: input.title,
      createdBy: input.createdBy,
      slug: input.slug,
      isTemplate: input.isTemplate,
      icon: null,
      coverUrl: null,
    });

    const savedPage = await this.pageRepo.save(page, context);

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

    await this.pageBlockRepo.save(block, context);
  }
}
