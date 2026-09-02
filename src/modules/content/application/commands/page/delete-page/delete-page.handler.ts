import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { DeletePageCommand } from './delete-page.command';

@Injectable()
export class DeletePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: DeletePageCommand): Promise<void> {
    await this.uow.runInTransaction(async (manager) => {
      /** 1. Find the current page. */
      const page = await this.pageRepo.findById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      /** 2. Ensure the page belongs to the requested workspace. */
      if (page.getWorkspaceId() !== command.workspaceId) {
        throw new NotFoundException('Page not found in workspace');
      }

      /** 3. Soft delete the complete page hierarchy. */
      await this.pageRepo.softDeleteHierarchy(
        command.pageId,
        command.userId,
        manager,
      );
    });
  }
}
