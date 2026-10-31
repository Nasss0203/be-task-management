import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { RestorePageBlockCommand } from './restore-page-block.command';
import type { PageActivityRecorder } from 'src/modules/content/application/ports/page-activity-recorder.port';

@Injectable()
export class RestorePageBlockHandler {
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
      await this.pageRepo.touch(block.getPageId(), context);
      // No PAGE_BLOCK_RESTORED action: a restored block counts as created.
      await this.activity.record(
        {
          actorId: command.actorId,
          pageId: block.getPageId(),
          blockId: block.getId(),
          action: 'PAGE_BLOCK_CREATED',
          kind: 'RESTORED',
        },
        context,
      );
    });
  }
}
