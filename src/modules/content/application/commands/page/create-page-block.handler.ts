import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddDatabaseViewToBlockDto } from 'src/modules/content/application/dto/page/create-page-block.dto';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import {
  PageBlock,
  PageBlockType,
  type PageBlockJson,
  type PageBlockStyleConfig,
} from 'src/modules/content/domain/entities/page-block.entity';
import { canContainChildren } from 'src/modules/content/domain/policies/page-block-container.policy';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

export class CreatePageBlockCommand {
  constructor(
    public readonly input: {
      pageId: string;
      parentBlockId?: string | null;
      type: PageBlockType;
      createdBy: string;
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

export class AddDatabaseViewToBlockCommand {
  constructor(
    public readonly blockId: string,
    public readonly dto: AddDatabaseViewToBlockDto,
  ) {}
}

@Injectable()
export class CreatePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    command: CreatePageBlockCommand,
  ): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (context) => {
      const parentBlockId = command.input.parentBlockId ?? null;

      if (parentBlockId) {
        const parent = await this.pageBlockRepo.findById(
          parentBlockId,
          context,
        );

        if (!parent) {
          throw new NotFoundException('Parent page block not found');
        }

        if (parent.getPageId() !== command.input.pageId) {
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

      const lastSibling = await this.pageBlockRepo.findLastSibling(
        command.input.pageId,
        parentBlockId,
        context,
      );
      const orderIndex = lastSibling ? lastSibling.getOrderIndex() + 1 : 0;

      const block = PageBlock.create({
        pageId: command.input.pageId,
        parentBlockId,
        type: command.input.type,
        title: command.input.title,
        positionX: command.input.positionX,
        positionY: command.input.positionY,
        width: command.input.width,
        height: command.input.height,
        orderIndex,
        content: command.input.content,
        styleConfig: command.input.styleConfig,
        dataConfig: command.input.dataConfig,
        createdBy: command.input.createdBy,
        isOpen: command.input.isOpen ?? true,
      });

      const savedBlock = await this.pageBlockRepo.save(block, context);
      return PageBlockResponseDto.fromDomain(savedBlock);
    });
  }

  async addDatabaseViewToBlock(
    command: AddDatabaseViewToBlockCommand,
  ): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (context) => {
      const block = await this.pageBlockRepo.findById(command.blockId, context);
      if (!block) {
        throw new NotFoundException('Page block not found');
      }

      block.update({
        dataConfig: {
          database_id: command.dto.database_id,
          view_id: command.dto.view_id,
        },
      });

      const updatedBlock = await this.pageBlockRepo.save(block, context);
      return PageBlockResponseDto.fromDomain(updatedBlock);
    });
  }
}
