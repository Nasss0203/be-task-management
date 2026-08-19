import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { UnitOfWork } from 'src/interface/index.interface';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { UpdatePageBlockDto } from 'src/modules/content/application/dto/page/update-page-block.dto';
import { ReorderPageBlockDto } from 'src/modules/content/application/dto/page/reorder-page-block.dto';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';

export class UpdatePageBlockCommand {
  constructor(public readonly dto: UpdatePageBlockDto & { id: string }) {}
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
      const block = await this.pageBlockRepo.findById(command.dto.id, { manager });
      if (!block) {
        throw new NotFoundException('Page block not found');
      }

      block.update({
        title: command.dto.title,
        content: command.dto.content,
        styleConfig: command.dto.style_config,
        dataConfig: command.dto.data_config,
        positionX: command.dto.position_x,
        positionY: command.dto.position_y,
        width: command.dto.width,
        height: command.dto.height,
        isOpen: command.dto.is_open,
      });

      const updatedBlock = await this.pageBlockRepo.save(block, { manager });
      return PageBlockResponseDto.fromDomain(updatedBlock);
    });
  }

  async reorder(command: ReorderPageBlockCommand): Promise<PageBlockResponseDto[]> {
    return this.uow.runInTransaction(async (manager) => {
      const blocks = await this.pageBlockRepo.findByPageId(command.dto.page_id, { manager });
      
      const blockUpdates = new Map(
        command.dto.items.map(b => [b.id, b.order_index])
      );

      for (const block of blocks) {
        const newOrder = blockUpdates.get(block.getId());
        if (newOrder !== undefined) {
          block.update({ orderIndex: newOrder });
        }
      }

      const updatedBlocks = await this.pageBlockRepo.saveMany(blocks, { manager });
      return updatedBlocks.map(b => PageBlockResponseDto.fromDomain(b));
    });
  }
}
