import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { ReorderPageBlockDto } from 'src/modules/content/application/dto/page/reorder-page-block.dto';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import type {
  PageBlock,
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/modules/content/domain/entities/page-block.entity';

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

@Injectable()
export class UpdatePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: UpdatePageBlockCommand): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const block = await this.pageBlockRepo.findById(command.blockId, { manager });
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

      const updatedBlock = await this.pageBlockRepo.save(block, { manager });
      return PageBlockResponseDto.fromDomain(updatedBlock);
    });
  }

  async reorder(command: ReorderPageBlockCommand): Promise<PageBlockResponseDto[]> {
    return this.uow.runInTransaction(async (manager) => {
      const blocks = await this.pageBlockRepo.findByPageId(command.dto.page_id, { manager });

      this.validateFullReorderPayload(blocks, command.dto);

      const finalOrderByBlockId = new Map(
        command.dto.items.map((item) => [item.id, item.order_index]),
      );

      const maxCurrentOrderIndex = blocks.reduce(
        (max, block) => Math.max(max, block.getOrderIndex()),
        -1,
      );
      const maxFinalOrderIndex = command.dto.items.reduce(
        (max, item) => Math.max(max, item.order_index),
        -1,
      );
      const temporaryOrderOffset =
        Math.max(maxCurrentOrderIndex, maxFinalOrderIndex) + blocks.length + 1000;

      blocks.forEach((block, index) => {
        block.update({ orderIndex: temporaryOrderOffset + index });
      });
      await this.pageBlockRepo.saveMany(blocks, { manager });

      blocks.forEach((block) => {
        block.update({ orderIndex: finalOrderByBlockId.get(block.getId())! });
      });
      const updatedBlocks = await this.pageBlockRepo.saveMany(blocks, { manager });

      return updatedBlocks
        .sort((a, b) => a.getOrderIndex() - b.getOrderIndex())
        .map((block) => PageBlockResponseDto.fromDomain(block));
    });
  }

  private validateFullReorderPayload(
    blocks: PageBlock[],
    dto: ReorderPageBlockDto,
  ): void {
    if (dto.items.length !== blocks.length) {
      throw new BadRequestException(
        'Reorder payload must include all active page blocks',
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
          'Reorder payload contains a block outside the requested page',
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
