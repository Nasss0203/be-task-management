import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { UpdatePageBlockCommand } from './update-page-block.command';

@Injectable()
export class UpdatePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    command: UpdatePageBlockCommand,
  ): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (context) => {
      const block = await this.pageBlockRepo.findById(command.blockId, context);

      if (!block) {
        throw new NotFoundException('Page block not found');
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
