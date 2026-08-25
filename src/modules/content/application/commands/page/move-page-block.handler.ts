import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovePageBlockDto } from 'src/modules/content/application/dto/page/move-page-block.dto';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { PageBlockOrderingService } from 'src/modules/content/application/services/page-block-ordering.service';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { canContainChildren } from 'src/modules/content/domain/policies/page-block-container.policy';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

const PAGE_BLOCK_HIERARCHY_GUARD_LIMIT = 1000;

export class MovePageBlockCommand {
  constructor(
    public readonly blockId: string,
    public readonly dto: MovePageBlockDto,
  ) {}
}

@Injectable()
export class MovePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly ordering: PageBlockOrderingService,
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

    sourceFromOldSiblings.changeOrder(
      this.ordering.nextTemporaryOrder([...oldSiblings, sourceFromOldSiblings]),
    );
    await this.pageBlockRepo.save(sourceFromOldSiblings, context);

    await this.ordering.persistSequentialBlockOrder(
      oldRemainingSiblings,
      context,
    );

    const targetSiblings = await this.pageBlockRepo.findActiveSiblings(
      source.getPageId(),
      targetParentBlockId,
      context,
    );

    sourceFromOldSiblings.moveToParent(targetParentBlockId);
    sourceFromOldSiblings.changeOrder(
      this.ordering.nextTemporaryOrder([
        ...targetSiblings,
        sourceFromOldSiblings,
      ]),
    );
    await this.pageBlockRepo.save(sourceFromOldSiblings, context);

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

    if (!canContainChildren(targetParent.getType())) {
      throw new BadRequestException(
        `Block type ${targetParent.getType()} cannot contain children`,
      );
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
