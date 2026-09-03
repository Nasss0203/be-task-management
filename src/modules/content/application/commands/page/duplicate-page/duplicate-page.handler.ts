import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';

import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';

import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';

import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageResponseDto } from '../../../dto/page/response/page.response.dto';

import { DuplicatePageCommand } from './duplicate-page.command';

@Injectable()
export class DuplicatePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: DuplicatePageCommand): Promise<PageResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      /**
       * 1. Find source Page.
       */
      const sourcePage = await this.pageRepo.findById(command.pageId, manager);

      if (!sourcePage) {
        throw new NotFoundException('Page not found');
      }

      /**
       * 2. Verify Workspace.
       */
      if (sourcePage.getWorkspaceId() !== command.workspaceId) {
        throw new NotFoundException('Page not found in workspace');
      }

      /**
       * 3. Duplicate Page.
       */
      const duplicatedPage = Page.create({
        workspaceId: sourcePage.getWorkspaceId(),

        teamspaceId: sourcePage.getTeamspaceId(),

        parentPageId: sourcePage.getParentPageId(),

        title: `${sourcePage.getTitle()} copy`,

        icon: sourcePage.getIcon(),

        coverUrl: sourcePage.getCoverUrl(),

        createdBy: command.userId,

        slug: null,
      });

      const savedPage = await this.pageRepo.save(duplicatedPage, manager);

      /**
       * 4. Load source PageBlocks.
       */
      const sourceBlocks = await this.pageBlockRepo.findByPageId(
        command.pageId,
        manager,
      );

      /**
       * 5. Build parent -> children map.
       */
      const childrenMap = new Map<string | null, typeof sourceBlocks>();

      for (const block of sourceBlocks) {
        const parentBlockId = block.getParentBlockId();

        const children = childrenMap.get(parentBlockId) ?? [];

        children.push(block);

        childrenMap.set(parentBlockId, children);
      }

      /**
       * Giữ đúng sibling order.
       */
      for (const children of childrenMap.values()) {
        children.sort((a, b) => a.getOrderIndex() - b.getOrderIndex());
      }

      /**
       * 6. Clone PageBlock tree.
       */
      const cloneBlocks = async (
        sourceParentId: string | null,
        newParentId: string | null,
      ): Promise<void> => {
        const children = childrenMap.get(sourceParentId) ?? [];

        for (const sourceBlock of children) {
          const duplicatedBlock = PageBlock.create({
            pageId: savedPage.getId(),

            parentBlockId: newParentId,

            type: sourceBlock.getType(),

            title: sourceBlock.getTitle(),

            positionX: sourceBlock.getPositionX(),

            positionY: sourceBlock.getPositionY(),

            width: sourceBlock.getWidth(),

            height: sourceBlock.getHeight(),

            orderIndex: sourceBlock.getOrderIndex(),

            content: structuredClone(sourceBlock.getContent()),

            styleConfig: structuredClone(sourceBlock.getStyleConfig()),

            dataConfig: structuredClone(sourceBlock.getDataConfig()),

            createdBy: command.userId,

            isOpen: sourceBlock.getIsOpen(),
          });

          const savedBlock = await this.pageBlockRepo.save(
            duplicatedBlock,
            manager,
          );

          await cloneBlocks(sourceBlock.getId(), savedBlock.getId());
        }
      };

      /**
       * Clone bắt đầu từ root blocks.
       */
      await cloneBlocks(null, null);

      return PageResponseDto.fromDomain(savedPage);
    });
  }
}
