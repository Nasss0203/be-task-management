import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type {
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

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
