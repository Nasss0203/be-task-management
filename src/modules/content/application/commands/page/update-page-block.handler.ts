import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovePageBlockDto } from 'src/modules/content/application/dto/page/move-page-block.dto';
import { ReorderPageBlockDto } from 'src/modules/content/application/dto/page/reorder-page-block.dto';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type {
  PageBlock,
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

const PAGE_BLOCK_HIERARCHY_GUARD_LIMIT = 1000;

export class UpdatePageBlockCommand {
  constructor(
    public readonly blockId: string,
    public readonly updates: {
      title?: string | null;
      positionX?: number | null;
      positionY?: number | null;
      width?: number | null;
      height?: number | null;
      content?: PageBlockJson;
      styleConfig?: PageBlockStyleConfig;
      dataConfig?: PageBlockJson;
      isOpen?: boolean;
    },
  ) {}
}

export class ReorderPageBlockCommand {
  constructor(public readonly dto: ReorderPageBlockDto) {}
}

export class MovePageBlockCommand {
  constructor(
    public readonly blockId: string,
    public readonly dto: MovePageBlockDto,
  ) {}
}

@Injectable()
export class UpdatePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    command: UpdatePageBlockCommand,
  ): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (context) => {
      const block = await this.pageBlockRepo.findById(command.blockId, context);
      if (!block) {
        throw new NotFoundException('Page block not found');
      }

      block.update({
        title: command.updates.title,
        content: command.updates.content,
        styleConfig: command.updates.styleConfig,
        dataConfig: command.updates.dataConfig,
        positionX: command.updates.positionX,
        positionY: command.updates.positionY,
        width: command.updates.width,
        height: command.updates.height,
        isOpen: command.updates.isOpen,
      });

      const updatedBlock = await this.pageBlockRepo.save(block, context);
      return PageBlockResponseDto.fromDomain(updatedBlock);
    });
  }

  async reorder(
    command: ReorderPageBlockCommand,
  ): Promise<PageBlockResponseDto[]> {
    return this.uow.runInTransaction(async (context) => {
      const parentBlockId = command.dto.parent_block_id ?? null;

      await this.assertValidSiblingScopeParent(
        command.dto.page_id,
        parentBlockId,
        context,
      );

      const blocks = await this.pageBlockRepo.findActiveSiblings(
        command.dto.page_id,
        parentBlockId,
        context,
      );

      this.validateFullReorderPayload(blocks, command.dto);

      const finalOrderByBlockId = new Map(
        command.dto.items.map((item) => [item.id, item.order_index]),
      );

      const updatedBlocks = await this.persistBlockOrder(
        blocks,
        finalOrderByBlockId,
        context,
      );

      return updatedBlocks.map((block) =>
        PageBlockResponseDto.fromDomain(block),
      );
    });
  }

  async move(command: MovePageBlockCommand): Promise<PageBlockResponseDto> {
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

    return this.persistSequentialBlockOrder(reorderedSiblings, context);
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
      this.nextTemporaryOrder([...oldSiblings, sourceFromOldSiblings]),
    );
    await this.pageBlockRepo.save(sourceFromOldSiblings, context);

    await this.persistSequentialBlockOrder(oldRemainingSiblings, context);

    const targetSiblings = await this.pageBlockRepo.findActiveSiblings(
      source.getPageId(),
      targetParentBlockId,
      context,
    );

    sourceFromOldSiblings.moveToParent(targetParentBlockId);
    sourceFromOldSiblings.changeOrder(
      this.nextTemporaryOrder([...targetSiblings, sourceFromOldSiblings]),
    );
    await this.pageBlockRepo.save(sourceFromOldSiblings, context);

    const targetOrdering = this.insertAt(
      targetSiblings,
      sourceFromOldSiblings,
      targetOrderIndex,
    );

    return this.persistSequentialBlockOrder(targetOrdering, context);
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

    return targetParent;
  }

  private async assertValidSiblingScopeParent(
    pageId: string,
    parentBlockId: string | null,
    context?: PersistenceContext,
  ): Promise<void> {
    if (parentBlockId === null) {
      return;
    }

    const parent = await this.pageBlockRepo.findById(parentBlockId, context);

    if (!parent) {
      throw new NotFoundException('Parent page block not found');
    }

    if (parent.getPageId() !== pageId) {
      throw new BadRequestException(
        'Parent page block belongs to another page',
      );
    }
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

  private validateFullReorderPayload(
    blocks: PageBlock[],
    dto: ReorderPageBlockDto,
  ): void {
    if (dto.items.length !== blocks.length) {
      throw new BadRequestException(
        'Reorder payload must include all active sibling page blocks',
      );
    }

    const knownBlockIds = new Set(blocks.map((block) => block.getId()));
    const seenBlockIds = new Set<string>();
    const seenOrderIndexes = new Set<number>();

    for (const item of dto.items) {
      if (seenBlockIds.has(item.id)) {
        throw new BadRequestException('Duplicate block id in reorder payload');
      }
      seenBlockIds.add(item.id);

      if (!knownBlockIds.has(item.id)) {
        throw new BadRequestException(
          'Reorder payload contains a block outside the requested sibling scope',
        );
      }

      if (!Number.isInteger(item.order_index) || item.order_index < 0) {
        throw new BadRequestException('order_index must be an integer >= 0');
      }

      if (seenOrderIndexes.has(item.order_index)) {
        throw new BadRequestException(
          'Duplicate order_index in reorder payload',
        );
      }
      seenOrderIndexes.add(item.order_index);
    }
  }

  private async persistSequentialBlockOrder(
    blocks: PageBlock[],
    context?: PersistenceContext,
  ): Promise<PageBlock[]> {
    return this.persistBlockOrder(
      blocks,
      new Map(blocks.map((block, index) => [block.getId(), index])),
      context,
    );
  }

  private async persistBlockOrder(
    blocks: PageBlock[],
    finalOrderByBlockId: Map<string, number>,
    context?: PersistenceContext,
  ): Promise<PageBlock[]> {
    if (blocks.length === 0) {
      return [];
    }

    const temporaryOrderOffset = this.nextTemporaryOrder(
      blocks,
      Array.from(finalOrderByBlockId.values()),
    );

    blocks.forEach((block, index) => {
      block.changeOrder(temporaryOrderOffset + index);
    });
    await this.pageBlockRepo.saveMany(blocks, context);

    blocks.forEach((block) => {
      const finalOrderIndex = finalOrderByBlockId.get(block.getId());

      if (finalOrderIndex === undefined) {
        throw new BadRequestException('Missing final order for page block');
      }

      block.changeOrder(finalOrderIndex);
    });

    const updatedBlocks = await this.pageBlockRepo.saveMany(blocks, context);

    return updatedBlocks.sort((a, b) => a.getOrderIndex() - b.getOrderIndex());
  }

  private nextTemporaryOrder(
    blocks: PageBlock[],
    extraOrderIndexes: number[] = [],
  ): number {
    const maxCurrentOrderIndex = blocks.reduce(
      (max, block) => Math.max(max, block.getOrderIndex()),
      -1,
    );
    const maxExtraOrderIndex = extraOrderIndexes.reduce(
      (max, orderIndex) => Math.max(max, orderIndex),
      -1,
    );

    return (
      Math.max(maxCurrentOrderIndex, maxExtraOrderIndex) + blocks.length + 1000
    );
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
