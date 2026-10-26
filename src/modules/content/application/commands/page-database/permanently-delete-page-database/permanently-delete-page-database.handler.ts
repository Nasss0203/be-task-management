import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { findTrashedDatabaseBlocks } from '../find-trashed-database-blocks';
import { PermanentlyDeletePageDatabaseCommand } from './permanently-delete-page-database.command';

@Injectable()
export class PermanentlyDeletePageDatabaseHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepo: DatabaseRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: PermanentlyDeletePageDatabaseCommand): Promise<void> {
    await this.uow.runInTransaction(async (context) => {
      const blocks = await findTrashedDatabaseBlocks(
        this.databaseRepo,
        this.pageBlockRepo,
        command.pageId,
        command.databaseId,
        context,
      );

      // DATABASE_VIEW blocks never have children, so a hard delete is safe.
      await this.pageBlockRepo.deletePermanently(
        blocks.map((block) => block.getId()),
        context,
      );

      await this.databaseRepo.delete(command.databaseId, context);
    });
  }
}
