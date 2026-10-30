import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { isAllowedEmbedContent } from 'src/modules/content/domain/policies/page-block-embed.policy';

import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import {
  assertCanContain,
  assertValidLayoutStyle,
} from 'src/modules/content/domain/policies/page-block-container.policy';
import { PageBlockFormService } from 'src/modules/content/application/services/page-block-form.service';
import { UpdatePageBlockCommand } from './update-page-block.command';

@Injectable()
export class UpdatePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    private readonly forms: PageBlockFormService,
  ) {}

  async execute(
    command: UpdatePageBlockCommand,
  ): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (context) => {
      const block = await this.pageBlockRepo.findById(command.blockId, context);

      if (!block) {
        throw new NotFoundException('Page block not found');
      }

      const nextType = command.updates.type ?? block.getType();
      // content: null clears the field, so only undefined keeps the current value
      const nextContent =
        command.updates.content !== undefined
          ? command.updates.content
          : block.getContent();

      if (!isAllowedEmbedContent(nextType, nextContent)) {
        throw new BadRequestException('Unsupported embed URL');
      }

      // Columns are built with POST /pageBlock/columns, never by "Turn into"
      if (nextType !== block.getType()) {
        const structural = [PageBlockType.COLUMN_LIST, PageBlockType.COLUMN];

        if (
          structural.includes(nextType) ||
          structural.includes(block.getType())
        ) {
          throw new BadRequestException(
            'Columns cannot be turned into another block type',
          );
        }

        const parentBlockId = block.getParentBlockId();
        const parent = parentBlockId
          ? await this.pageBlockRepo.findById(parentBlockId, context)
          : null;

        assertCanContain(parent?.getType() ?? null, nextType);
      }

      assertValidLayoutStyle(nextType, command.updates.styleConfig);

      if (nextType === PageBlockType.SECTION) {
        await this.forms.assertValidSectionForm(
          {
            pageId: block.getPageId(),
            sectionId: block.getId(),
            current: block.getDataConfig(),
            next: command.updates.dataConfig,
          },
          context,
        );
      }

      if (
        nextType === PageBlockType.FORM_FIELD &&
        (command.updates.dataConfig !== undefined ||
          nextType !== block.getType())
      ) {
        const parentBlockId = block.getParentBlockId();
        const parent = parentBlockId
          ? await this.pageBlockRepo.findById(parentBlockId, context)
          : null;

        if (!parent) {
          throw new BadRequestException('A question must sit in a form');
        }

        await this.forms.assertValidFormField(
          parent,
          command.updates.dataConfig !== undefined
            ? command.updates.dataConfig
            : block.getDataConfig(),
          context,
        );
      }

      // "Turn into" must not slip a database into a task's content
      if (
        block.getRowId() !== null &&
        nextType === PageBlockType.DATABASE_VIEW
      ) {
        throw new BadRequestException('A task cannot contain a database view');
      }

      // Đổi view mặc định của block database thì được, đổi sang database khác thì không
      if (
        command.updates.dataConfig !== undefined &&
        block.getType() === PageBlockType.DATABASE_VIEW &&
        nextType === PageBlockType.DATABASE_VIEW
      ) {
        const nextConfig = command.updates.dataConfig;
        const nextDatabaseId =
          nextConfig && !Array.isArray(nextConfig)
            ? nextConfig.database_id
            : undefined;

        if (nextDatabaseId !== block.getReferencedDatabaseId()) {
          throw new BadRequestException(
            'A database view cannot point to another database',
          );
        }
      }

      if (command.updates.type !== undefined) {
        block.changeType(command.updates.type);
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
}
