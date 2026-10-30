import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { PageBlockColumnCleanupService } from 'src/modules/content/application/services/page-block-column-cleanup.service';
import { PageBlockOrderingService } from 'src/modules/content/application/services/page-block-ordering.service';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { assertCanContain } from 'src/modules/content/domain/policies/page-block-container.policy';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { CreatePageBlockColumnsCommand } from './create-page-block-columns.command';

const PAGE_BLOCK_HIERARCHY_GUARD_LIMIT = 1000;

@Injectable()
export class CreatePageBlockColumnsHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly ordering: PageBlockOrderingService,
    private readonly columnCleanup: PageBlockColumnCleanupService,
  ) {}

  async execute(
    command: CreatePageBlockColumnsCommand,
  ): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (context) => {
      const blocks = await this.loadBlocks(command, context);
      const ids = new Set(blocks.map((block) => block.getId()));
      const [anchor] = blocks;
      const rowId = anchor.getRowId();
      const parentBlockId = anchor.getParentBlockId();

      const parent = parentBlockId
        ? await this.pageBlockRepo.findById(parentBlockId, context)
        : null;
      assertCanContain(parent?.getType() ?? null, PageBlockType.COLUMN_LIST);

      for (const block of blocks) {
        await this.assertNoAncestorIn(block, ids, context);
      }

      const oldParentIds = new Set(
        blocks.map((block) => block.getParentBlockId()),
      );
      const siblings = await this.pageBlockRepo.findActiveSiblings(
        command.pageId,
        rowId,
        parentBlockId,
        context,
      );

      const row = await this.pageBlockRepo.save(
        PageBlock.create({
          pageId: command.pageId,
          rowId,
          parentBlockId,
          type: PageBlockType.COLUMN_LIST,
          createdBy: command.userId,
          orderIndex: this.ordering.nextTemporaryOrder(siblings),
        }),
        context,
      );

      const widthRatio = Math.round((1 / blocks.length) * 10000) / 10000;

      for (const [index, block] of blocks.entries()) {
        const column = await this.pageBlockRepo.save(
          PageBlock.create({
            pageId: command.pageId,
            rowId,
            parentBlockId: row.getId(),
            type: PageBlockType.COLUMN,
            createdBy: command.userId,
            orderIndex: index,
            styleConfig: { width_ratio: widthRatio },
          }),
          context,
        );

        block.moveToParent(column.getId());
        block.changeOrder(0);
        await this.pageBlockRepo.save(block, context);
      }

      const before = siblings
        .slice(
          0,
          siblings.findIndex((block) => block.getId() === anchor.getId()),
        )
        .filter((block) => !ids.has(block.getId()));
      const after = siblings
        .filter((block) => !ids.has(block.getId()))
        .slice(before.length);
      await this.ordering.persistSequentialBlockOrder(
        [...before, row, ...after],
        context,
      );

      // A block pulled out of another column row may leave that row too small.
      for (const oldParentId of oldParentIds) {
        if (oldParentId !== parentBlockId) {
          await this.columnCleanup.tidy(oldParentId, command.userId, context);
        }
      }

      return PageBlockResponseDto.fromDomain(row);
    });
  }

  private async loadBlocks(
    command: CreatePageBlockColumnsCommand,
    context: PersistenceContext,
  ): Promise<PageBlock[]> {
    if (new Set(command.blockIds).size !== command.blockIds.length) {
      throw new BadRequestException('Each block can be placed only once');
    }

    const blocks: PageBlock[] = [];

    for (const blockId of command.blockIds) {
      const block = await this.pageBlockRepo.findById(blockId, context);

      if (!block || block.getPageId() !== command.pageId) {
        throw new NotFoundException('Page block not found on this page');
      }

      if (
        block.getType() === PageBlockType.COLUMN ||
        block.getType() === PageBlockType.COLUMN_LIST
      ) {
        throw new BadRequestException('Columns cannot be put into columns');
      }

      assertCanContain(PageBlockType.COLUMN, block.getType());

      blocks.push(block);
    }

    if (blocks.some((block) => block.getRowId() !== blocks[0].getRowId())) {
      throw new BadRequestException(
        'Blocks of a task and of its page cannot share a column row',
      );
    }

    return blocks;
  }

  /** A block cannot share a row with a block it sits inside (e.g. its own toggle). */
  private async assertNoAncestorIn(
    block: PageBlock,
    ids: Set<string>,
    context: PersistenceContext,
  ): Promise<void> {
    let parentId = block.getParentBlockId();
    let guard = 0;

    while (parentId) {
      if (ids.has(parentId)) {
        throw new BadRequestException(
          'A block cannot be put beside a block that contains it',
        );
      }

      if (++guard > PAGE_BLOCK_HIERARCHY_GUARD_LIMIT) {
        throw new BadRequestException('Invalid page block hierarchy');
      }

      parentId =
        (
          await this.pageBlockRepo.findById(parentId, context)
        )?.getParentBlockId() ?? null;
    }
  }
}
