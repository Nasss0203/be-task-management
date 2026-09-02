import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PageBlockType } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { AddDatabaseViewToBlockCommand } from './add-database-view-to-block.command';

@Injectable()
export class AddDatabaseViewToBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
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

      return PageBlockResponseDto.fromDomain(updatedBlock);
    });
  }
}
