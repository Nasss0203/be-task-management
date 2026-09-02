import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { RestorePageBlockCommand } from './restore-page-block.command';

@Injectable()
export class RestorePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: RestorePageBlockCommand): Promise<void> {
    await this.uow.runInTransaction(async (context) => {
      const block = await this.pageBlockRepo.findDeletedById(
        command.blockId,
        context,
      );

      if (!block) {
        throw new NotFoundException('Deleted page block not found');
      }

      const parentBlockId = block.getParentBlockId();

      if (parentBlockId) {
        const parent = await this.pageBlockRepo.findById(
          parentBlockId,
          context,
        );

        if (!parent) {
          throw new BadRequestException(
            'Cannot restore page block while parent is deleted or missing',
          );
        }
      }

      block.restoreDeleted();
      await this.pageBlockRepo.save(block, context);
    });
  }
}
