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
import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import {
  assertCanContain,
  MAX_COLUMNS,
} from 'src/modules/content/domain/policies/page-block-container.policy';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { MovePageBlockCommand } from './move-page-block.command';

const PAGE_BLOCK_HIERARCHY_GUARD_LIMIT = 1000;

@Injectable()
export class MovePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly ordering: PageBlockOrderingService,
    private readonly columnCleanup: PageBlockColumnCleanupService,
  ) {}

  async execute(command: MovePageBlockCommand): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (context) => {
      this.assertValidTargetOrderIndex(command.dto.target_order_index);

      const source = await this.pageBlockRepo.findById(
        command.blockId,
        context,
      );

      if (!source) {
        throw new NotFoundException('Page block not found');
      }

      const targetParentBlockId = command.dto.target_parent_block_id ?? null;
      const currentParentBlockId = source.getParentBlockId();

      const targetParent = await this.resolveTargetParent(
        source,
        targetParentBlockId,
        context,
      );

      if (targetParent) {
        await this.assertNoCircularHierarchy(
          source.getId(),
          targetParent,
          context,
        );
      }

      const isSameParent = currentParentBlockId === targetParentBlockId;

      if (source.getType() === PageBlockType.FORM_FIELD && !isSameParent) {
        throw new BadRequestException(
          'A question can only be reordered within its form',
        );
      }

      if (isSameParent) {
        const updatedBlocks = await this.moveWithinSameParent(
          source,
          command.dto.target_order_index,
          context,
        );

        return PageBlockResponseDto.fromDomain(
          this.pickUpdatedSource(updatedBlocks, source.getId()),
        );
      }

      const updatedBlocks = await this.moveAcrossParents(
        source,
        targetParentBlockId,
        command.dto.target_order_index,
        context,
      );

      // Leaving a column may empty it, or leave its row with a single column.
      await this.columnCleanup.tidy(
        currentParentBlockId,
        command.userId,
        context,
      );

      return PageBlockResponseDto.fromDomain(
        this.pickUpdatedSource(updatedBlocks, source.getId()),
      );
    });
  }

  private async moveWithinSameParent(
    source: PageBlock,
    targetOrderIndex: number,
    context?: PersistenceContext,
  ): Promise<PageBlock[]> {
    const siblings = await this.pageBlockRepo.findActiveSiblings(
      source.getPageId(),
      source.getRowId(),
      source.getParentBlockId(),
      context,
    );
    const sourceFromSiblings = this.pickSourceFromSiblings(
      siblings,
      source.getId(),
    );
    const reorderedSiblings = this.insertAt(
      siblings.filter((block) => block.getId() !== source.getId()),
      sourceFromSiblings,
      targetOrderIndex,
    );

    return this.ordering.persistSequentialBlockOrder(
      reorderedSiblings,
      context,
    );
  }

  private async moveAcrossParents(
    source: PageBlock,
    targetParentBlockId: string | null,
    targetOrderIndex: number,
    context?: PersistenceContext,
  ): Promise<PageBlock[]> {
    const oldSiblings = await this.pageBlockRepo.findActiveSiblings(
      source.getPageId(),
      source.getRowId(),
      source.getParentBlockId(),
      context,
    );
    const sourceFromOldSiblings = this.pickSourceFromSiblings(
      oldSiblings,
      source.getId(),
    );
    const oldRemainingSiblings = oldSiblings.filter(
      (block) => block.getId() !== source.getId(),
    );

    // A block stays in its own content: a task's blocks never move to the page.
    const targetSiblings = await this.pageBlockRepo.findActiveSiblings(
      source.getPageId(),
      source.getRowId(),
      targetParentBlockId,
      context,
    );

    // Leave the old parent first: parking the block among its old siblings
    // could collide with the temporary orders used to renumber them.
    sourceFromOldSiblings.moveToParent(targetParentBlockId);
    sourceFromOldSiblings.changeOrder(
      this.ordering.nextTemporaryOrder([
        ...targetSiblings,
        sourceFromOldSiblings,
      ]),
    );
    await this.pageBlockRepo.save(sourceFromOldSiblings, context);

    await this.ordering.persistSequentialBlockOrder(
      oldRemainingSiblings,
      context,
    );

    const targetOrdering = this.insertAt(
      targetSiblings,
      sourceFromOldSiblings,
      targetOrderIndex,
    );

    return this.ordering.persistSequentialBlockOrder(targetOrdering, context);
  }

  private async resolveTargetParent(
    source: PageBlock,
    targetParentBlockId: string | null,
    context?: PersistenceContext,
  ): Promise<PageBlock | null> {
    if (targetParentBlockId === null) {
      assertCanContain(null, source.getType());
      return null;
    }

    if (source.getId() === targetParentBlockId) {
      throw new BadRequestException('Page block cannot be its own parent');
    }

    const targetParent = await this.pageBlockRepo.findById(
      targetParentBlockId,
      context,
    );

    if (!targetParent) {
      throw new NotFoundException('Target parent page block not found');
    }

    if (targetParent.getPageId() !== source.getPageId()) {
      throw new BadRequestException(
        'Target parent page block belongs to another page',
      );
    }

    if (targetParent.getRowId() !== source.getRowId()) {
      throw new BadRequestException(
        'Target parent page block belongs to other content',
      );
    }

    assertCanContain(targetParent.getType(), source.getType());

    if (
      source.getType() === PageBlockType.COLUMN &&
      source.getParentBlockId() !== targetParent.getId()
    ) {
      const columns = await this.pageBlockRepo.findActiveChildren(
        targetParent.getId(),
        context,
      );

      if (columns.length >= MAX_COLUMNS) {
        throw new BadRequestException(
          `A column row holds at most ${MAX_COLUMNS} columns`,
        );
      }
    }

    return targetParent;
  }

  private async assertNoCircularHierarchy(
    sourceBlockId: string,
    targetParent: PageBlock,
    context?: PersistenceContext,
  ): Promise<void> {
    let current: PageBlock | null = targetParent;
    let guard = 0;

    while (current) {
      if (current.getId() === sourceBlockId) {
        throw new BadRequestException(
          'Cannot move a page block under one of its descendants',
        );
      }

      const parentBlockId = current.getParentBlockId();

      if (!parentBlockId) {
        return;
      }

      guard += 1;

      if (guard > PAGE_BLOCK_HIERARCHY_GUARD_LIMIT) {
        throw new BadRequestException('Invalid page block hierarchy');
      }

      current = await this.pageBlockRepo.findById(parentBlockId, context);

      if (!current) {
        throw new BadRequestException('Invalid page block hierarchy');
      }
    }
  }

  private insertAt(
    blocks: PageBlock[],
    source: PageBlock,
    targetOrderIndex: number,
  ): PageBlock[] {
    const clampedOrderIndex = Math.min(targetOrderIndex, blocks.length);
    const result = [...blocks];
    result.splice(clampedOrderIndex, 0, source);
    return result;
  }

  private pickSourceFromSiblings(
    siblings: PageBlock[],
    sourceBlockId: string,
  ): PageBlock {
    const source = siblings.find((block) => block.getId() === sourceBlockId);

    if (!source) {
      throw new BadRequestException(
        'Source page block is outside its active sibling scope',
      );
    }

    return source;
  }

  private pickUpdatedSource(
    blocks: PageBlock[],
    sourceBlockId: string,
  ): PageBlock {
    const source = blocks.find((block) => block.getId() === sourceBlockId);

    if (!source) {
      throw new BadRequestException('Updated source page block not found');
    }

    return source;
  }

  private assertValidTargetOrderIndex(targetOrderIndex: number): void {
    if (!Number.isInteger(targetOrderIndex) || targetOrderIndex < 0) {
      throw new BadRequestException(
        'target_order_index must be an integer >= 0',
      );
    }
  }
}
