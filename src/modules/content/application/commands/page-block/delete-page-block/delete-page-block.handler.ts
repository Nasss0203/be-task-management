import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { DeletePageBlockCommand } from './delete-page-block.command';

const PAGE_BLOCK_SUBTREE_GUARD_LIMIT = 10000;

@Injectable()
export class DeletePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: DeletePageBlockCommand): Promise<void> {
    await this.uow.runInTransaction(async (context) => {
      const block = await this.pageBlockRepo.findById(command.blockId, context);
      if (!block) {
        throw new NotFoundException('Page block not found');
      }

      const subtree = await this.collectActiveSubtree(block, context);
      subtree.forEach((subtreeBlock) => {
        subtreeBlock.markAsDeleted(command.userId);
      });

      await this.pageBlockRepo.saveMany(subtree, context);
    });
  }

  private async collectActiveSubtree(
    root: PageBlock,
    context?: PersistenceContext,
  ): Promise<PageBlock[]> {
    const visitedBlockIds = new Set<string>();
    const subtree: PageBlock[] = [];
    const stack = [root];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (visitedBlockIds.has(current.getId())) {
        throw new BadRequestException('Invalid page block hierarchy');
      }

      visitedBlockIds.add(current.getId());
      subtree.push(current);

      if (subtree.length > PAGE_BLOCK_SUBTREE_GUARD_LIMIT) {
        throw new BadRequestException('Invalid page block hierarchy');
      }

      const children = await this.pageBlockRepo.findActiveChildren(
        current.getId(),
        context,
      );
      stack.push(...children);
    }

    return subtree;
  }
}
