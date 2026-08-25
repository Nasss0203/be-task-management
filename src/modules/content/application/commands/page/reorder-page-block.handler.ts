import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReorderPageBlockDto } from 'src/modules/content/application/dto/page/reorder-page-block.dto';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { PageBlockOrderingService } from 'src/modules/content/application/services/page-block-ordering.service';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { canContainChildren } from 'src/modules/content/domain/policies/page-block-container.policy';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

export class ReorderPageBlockCommand {
  constructor(public readonly dto: ReorderPageBlockDto) {}
}

@Injectable()
export class ReorderPageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly ordering: PageBlockOrderingService,
  ) {}

  async execute(
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

      const updatedBlocks = await this.ordering.persistBlockOrder(
        blocks,
        finalOrderByBlockId,
        context,
      );

      return updatedBlocks.map((block) =>
        PageBlockResponseDto.fromDomain(block),
      );
    });
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

    if (!canContainChildren(parent.getType())) {
      throw new BadRequestException(
        `Block type ${parent.getType()} cannot contain children`,
      );
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
}
