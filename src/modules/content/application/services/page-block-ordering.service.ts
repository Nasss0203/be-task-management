import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

@Injectable()
export class PageBlockOrderingService {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
  ) {}

  async persistSequentialBlockOrder(
    blocks: PageBlock[],
    context?: PersistenceContext,
  ): Promise<PageBlock[]> {
    return this.persistBlockOrder(
      blocks,
      new Map(blocks.map((block, index) => [block.getId(), index])),
      context,
    );
  }

  async persistBlockOrder(
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

  nextTemporaryOrder(
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
}
