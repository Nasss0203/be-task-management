import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { AddDatabaseViewToBlockCommand } from './add-database-view-to-block.command';
import type { PageActivityRecorder } from 'src/modules/content/application/ports/page-activity-recorder.port';

@Injectable()
export class AddDatabaseViewToBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
    @Inject(CONTENT_TYPES.ports.PageActivityRecorder)
    private readonly activity: PageActivityRecorder,
  ) {}

  async execute(
    command: AddDatabaseViewToBlockCommand,
  ): Promise<PageBlockResponseDto> {
    return this.uow.runInTransaction(async (context) => {
      const block = await this.pageBlockRepo.findById(command.blockId, context);

      if (!block) {
        throw new NotFoundException('Page block not found');
      }

      if (block.getType() !== PageBlockType.DATABASE_VIEW) {
        throw new BadRequestException(
          'Only DATABASE_VIEW blocks can reference a database view',
        );
      }

      block.update({
        dataConfig: {
          database_id: command.dto.database_id,

          view_id: command.dto.view_id,
        },
      });

      const updatedBlock = await this.pageBlockRepo.save(block, context);

      await this.pageRepo.touch(block.getPageId(), context);
      await this.activity.record(
        {
          actorId: command.actorId,
          pageId: block.getPageId(),
          blockId: block.getId(),
          action: 'PAGE_BLOCK_CREATED',
        },
        context,
      );
      return PageBlockResponseDto.fromDomain(updatedBlock);
    });
  }
}
