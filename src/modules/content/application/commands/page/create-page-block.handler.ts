import { Inject, Injectable } from '@nestjs/common';
import type { UnitOfWork } from 'src/interface/index.interface';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlock, PageBlockType } from 'src/modules/content/domain/entities/page-block.entity';
import { CreatePageBlockDto, AddDatabaseViewToBlockDto } from 'src/modules/content/application/dto/page/create-page-block.dto';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { NotFoundException } from '@nestjs/common';

export class CreatePageBlockCommand {
  constructor(public readonly dto: CreatePageBlockDto & { created_by: string }) {}
}

export class AddDatabaseViewToBlockCommand {
  constructor(public readonly blockId: string, public readonly dto: AddDatabaseViewToBlockDto) {}
}

@Injectable()
export class CreatePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: CreatePageBlockCommand): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      // Shift order indexes if needed
      await this.pageBlockRepo.shiftOrderIndexesForInsert(
        command.dto.page_id,
        command.dto.order_index ?? 0,
        { manager }
      );

      const block = PageBlock.create({
        pageId: command.dto.page_id,
        type: command.dto.type,
        title: command.dto.title,
        positionX: command.dto.position_x,
        positionY: command.dto.position_y,
        width: command.dto.width,
        height: command.dto.height,
        orderIndex: command.dto.order_index ?? 0,
        content: command.dto.content,
        styleConfig: command.dto.style_config,
        dataConfig: command.dto.data_config,
        createdBy: command.dto.created_by,
        isOpen: true,
      });

      const savedBlock = await this.pageBlockRepo.save(block, { manager });
      return PageBlockResponseDto.fromDomain(savedBlock);
    });
  }

  async addDatabaseViewToBlock(command: AddDatabaseViewToBlockCommand): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const block = await this.pageBlockRepo.findById(command.blockId, { manager });
      if (!block) {
        throw new NotFoundException('Page block not found');
      }

      block.update({
        dataConfig: {
          workspace_id: command.dto.workspace_id,
          project_id: command.dto.project_id,
          default_board_id: command.dto.board_id ?? null,
          default_view_type: command.dto.view_type,
        },
      });

      const updatedBlock = await this.pageBlockRepo.save(block, { manager });
      return PageBlockResponseDto.fromDomain(updatedBlock);
    });
  }
}
