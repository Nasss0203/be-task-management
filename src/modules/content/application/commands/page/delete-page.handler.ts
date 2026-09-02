import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

export class DeletePageCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly pageId: string,
    public readonly userId: string,
  ) {}
}

export class RestorePageCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly pageId: string,
    public readonly userId: string,
  ) {}
}

export class PermanentlyDeletePageCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly pageId: string,
  ) {}
}
@Injectable()
export class DeletePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async delete(command: DeletePageCommand): Promise<void> {
    await this.uow.runInTransaction(async (manager) => {
      /**
       * 1. Tìm Page hiện tại.
       */
      const page = await this.pageRepo.findById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      /**
       * 2. Đảm bảo Page thuộc đúng Workspace.
       */
      if (page.getWorkspaceId() !== command.workspaceId) {
        throw new NotFoundException('Page not found in workspace');
      }

      /**
       * 3. Soft delete toàn bộ cây Page.
       *
       * Parent
       * ├── Child
       * │   └── Grandchild
       * └── Child
       */
      await this.pageRepo.softDeleteHierarchy(
        command.pageId,
        command.userId,
        manager,
      );
    });
  }
  async restore(command: RestorePageCommand): Promise<void> {
    await this.uow.runInTransaction(async (manager) => {
      const page = await this.pageRepo.findDeletedById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Deleted page not found');
      }

      if (page.getWorkspaceId() !== command.workspaceId) {
        throw new NotFoundException('Deleted page not found in workspace');
      }

      await this.pageRepo.restoreHierarchy(command.pageId, manager);
    });
  }

  async permanentlyDelete(
    command: PermanentlyDeletePageCommand,
  ): Promise<void> {
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
