import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import {
  PageBlock,
  PageBlockType,
  type PageBlockJson,
  type PageBlockStyleConfig,
} from 'src/modules/content/domain/entities/page-block.entity';
import { AddDatabaseViewToBlockDto } from 'src/modules/content/application/dto/page/create-page-block.dto';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';

export class CreatePageBlockCommand {
  constructor(
    public readonly input: {
      pageId: string;
      type: PageBlockType;
      createdBy: string;
      title?: string | null;
      positionX?: number | null;
      positionY?: number | null;
      width?: number | null;
      height?: number | null;
      orderIndex?: number;
      content?: PageBlockJson;
      styleConfig?: PageBlockStyleConfig;
      dataConfig?: PageBlockJson;
      isOpen?: boolean;
    },
  ) {}
}

export class AddDatabaseViewToBlockCommand {
  constructor(public readonly blockId: string, public readonly dto: AddDatabaseViewToBlockDto) {}
}

@Injectable()
export class CreatePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: CreatePageBlockCommand): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      // Shift order indexes if needed
      await this.pageBlockRepo.shiftOrderIndexesForInsert(
        command.input.pageId,
        command.input.orderIndex ?? 0,
        { manager }
      );

      const block = PageBlock.create({
        pageId: command.input.pageId,
        type: command.input.type,
        title: command.input.title,
        positionX: command.input.positionX,
        positionY: command.input.positionY,
        width: command.input.width,
        height: command.input.height,
        orderIndex: command.input.orderIndex ?? 0,
        content: command.input.content,
        styleConfig: command.input.styleConfig,
        dataConfig: command.input.dataConfig,
        createdBy: command.input.createdBy,
        isOpen: command.input.isOpen ?? true,
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
