import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';

import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { DuplicatePageBlockCommand } from './duplicate-page-block.command';

@Injectable()
export class DuplicatePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    command: DuplicatePageBlockCommand,
  ): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (context) => {
      const source = await this.pageBlockRepo.findById(
        command.blockId,
        context,
      );

      if (!source) {
        throw new NotFoundException('Page block not found');
      }

      const pageId = source.getPageId();
      const parentBlockId = source.getParentBlockId();
      const orderIndex = source.getOrderIndex() + 1;

      // Make room right after the source block, same as create with afterBlockId
      await this.pageBlockRepo.shiftSiblingOrderIndexes(
        pageId,
        parentBlockId,
        orderIndex,
        context,
      );

      // findByPageId already sorts by order_index
      const blocks = await this.pageBlockRepo.findByPageId(pageId, context);

      const childrenMap = new Map<string, PageBlock[]>();

      for (const block of blocks) {
        const parentId = block.getParentBlockId();

        if (!parentId) continue;

        const children = childrenMap.get(parentId) ?? [];

        children.push(block);

        childrenMap.set(parentId, children);
      }

      const cloneBlock = async (
        block: PageBlock,
        newParentId: string | null,
        newOrderIndex: number,
      ): Promise<PageBlock> => {
        const saved = await this.pageBlockRepo.save(
          PageBlock.create({
            pageId,
            parentBlockId: newParentId,
            type: block.getType(),
            title: block.getTitle(),
            positionX: block.getPositionX(),
            positionY: block.getPositionY(),
            width: block.getWidth(),
            height: block.getHeight(),
            orderIndex: newOrderIndex,
            content: structuredClone(block.getContent()),
            styleConfig: structuredClone(block.getStyleConfig()),
            dataConfig: structuredClone(block.getDataConfig()),
            createdBy: command.userId,
            isOpen: block.getIsOpen(),
          }),
          context,
        );

        for (const child of childrenMap.get(block.getId()) ?? []) {
          await cloneBlock(child, saved.getId(), child.getOrderIndex());
        }

        return saved;
      };

      const copy = await cloneBlock(source, parentBlockId, orderIndex);

      return PageBlockResponseDto.fromDomain(copy);
    });
  }
}
