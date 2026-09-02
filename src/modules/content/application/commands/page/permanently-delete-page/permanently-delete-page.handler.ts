import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PermanentlyDeletePageCommand } from './permanently-delete-page.command';

@Injectable()
export class PermanentlyDeletePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: PermanentlyDeletePageCommand): Promise<void> {
    await this.uow.runInTransaction(async (manager) => {
      const page = await this.pageRepo.findDeletedById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Deleted page not found');
      }

      if (page.getWorkspaceId() !== command.workspaceId) {
        throw new NotFoundException('Deleted page not found in workspace');
      }

      await this.pageRepo.deletePermanently(command.pageId, manager);
    });
  }
}
