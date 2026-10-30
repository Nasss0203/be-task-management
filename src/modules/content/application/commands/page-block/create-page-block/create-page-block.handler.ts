import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { PageBlockRowScopeService } from 'src/modules/content/application/services/page-block-row-scope.service';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';

import {
  assertCanContain,
  assertValidColumnStyle,
  MAX_COLUMNS,
} from 'src/modules/content/domain/policies/page-block-container.policy';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

import { isAllowedEmbedContent } from 'src/modules/content/domain/policies/page-block-embed.policy';

import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { CreatePageBlockCommand } from './create-page-block.command';

@Injectable()
export class CreatePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    private readonly rowScope: PageBlockRowScopeService,
  ) {}

  async execute(
    command: CreatePageBlockCommand,
  ): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (context) => {
      const {
        pageId,
        type,
        createdBy,
        title,
        positionX,
        positionY,
        width,
        height,
        content,
        styleConfig,
        dataConfig,
        isOpen,
      } = command.input;

      if (!isAllowedEmbedContent(type, content)) {
        throw new BadRequestException('Unsupported embed URL');
      }

      const parentBlockId = command.input.parentBlockId ?? null;
      const rowId = command.input.rowId ?? null;

      this.rowScope.assertTypeAllowed(rowId, type);

      if (rowId) {
        await this.rowScope.assertRowOnPage(rowId, pageId, context);
      }

      const afterBlockId = command.input.afterBlockId ?? null;

      assertValidColumnStyle(type, styleConfig);

      if (!parentBlockId) {
        assertCanContain(null, type);
      } else {
        const parent = await this.pageBlockRepo.findById(
          parentBlockId,
          context,
        );

        if (!parent) {
          throw new NotFoundException('Parent page block not found');
        }

        if (parent.getPageId() !== pageId) {
          throw new BadRequestException(
            'Parent page block belongs to another page',
          );
        }

        if (parent.getRowId() !== rowId) {
          throw new BadRequestException(
            'Parent page block belongs to other content',
          );
        }

        assertCanContain(parent.getType(), type);

        if (type === PageBlockType.COLUMN) {
          const columns = await this.pageBlockRepo.findActiveChildren(
            parent.getId(),
            context,
          );

          if (columns.length >= MAX_COLUMNS) {
            throw new BadRequestException(
              `A column row holds at most ${MAX_COLUMNS} columns`,
            );
          }
        }
      }

      let orderIndex: number;

      if (afterBlockId) {
        const afterBlock = await this.pageBlockRepo.findById(
          afterBlockId,
          context,
        );

        if (!afterBlock) {
          throw new NotFoundException('Previous page block not found');
        }

        if (afterBlock.getPageId() !== pageId) {
          throw new BadRequestException(
            'Previous page block belongs to another page',
          );
        }

        if (
          afterBlock.getParentBlockId() !== parentBlockId ||
          afterBlock.getRowId() !== rowId
        ) {
          throw new BadRequestException(
            'Previous page block belongs to another parent',
          );
        }

        orderIndex = afterBlock.getOrderIndex() + 1;

        await this.pageBlockRepo.shiftSiblingOrderIndexes(
          pageId,
          rowId,
          parentBlockId,
          orderIndex,
          context,
        );
      } else {
        const lastSibling = await this.pageBlockRepo.findLastSibling(
          pageId,
          rowId,
          parentBlockId,
          context,
        );

        orderIndex = lastSibling ? lastSibling.getOrderIndex() + 1 : 0;
      }

      /**
       * 3. Create block
       */
      const block = PageBlock.create({
        pageId,
        rowId,
        parentBlockId,

        type,

        title,

        positionX,
        positionY,

        width,
        height,

        orderIndex,

        content,
        styleConfig,
        dataConfig,

        createdBy,

        isOpen: isOpen ?? true,
      });

      const savedBlock = await this.pageBlockRepo.save(block, context);

      return PageBlockResponseDto.fromDomain(savedBlock);
    });
  }
}
