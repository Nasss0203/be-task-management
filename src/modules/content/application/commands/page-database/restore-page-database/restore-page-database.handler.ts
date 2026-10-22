import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { findTrashedDatabaseBlocks } from '../find-trashed-database-blocks';
import { RestorePageDatabaseCommand } from './restore-page-database.command';

@Injectable()
export class RestorePageDatabaseHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepo: DatabaseRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: RestorePageDatabaseCommand): Promise<void> {
    await this.uow.runInTransaction(async (context) => {
      const [block] = await findTrashedDatabaseBlocks(
        this.databaseRepo,
        this.pageBlockRepo,
        command.pageId,
        command.databaseId,
        context,
      );

      const parentBlockId = block.getParentBlockId();

      // Parent (e.g. a toggle) is still deleted: bring the database back at the page root.
      if (
        parentBlockId &&
        !(await this.pageBlockRepo.findById(parentBlockId, context))
      ) {
        const lastRootBlock = await this.pageBlockRepo.findLastSibling(
          command.pageId,
          null,
          context,
        );

        block.moveToParent(null);
        block.changeOrder(
          lastRootBlock ? lastRootBlock.getOrderIndex() + 1 : 0,
        );
      }

      block.restoreDeleted();

      await this.pageBlockRepo.save(block, context);
    });
  }
}
