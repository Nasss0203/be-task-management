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
  constructor(public readonly pageId: string) {}
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
    console.log('🚀 ~ command~', command);
    await this.uow.runInTransaction(async (context) => {
      const page = await this.pageRepo.findById(command.pageId, context);
      if (!page) {
        throw new NotFoundException('Page not found');
      }

      // Check workspace
      if (page.getWorkspaceId() !== command.workspaceId) {
        throw new NotFoundException('Page not found in workspace');
      }

      page.markAsDeleted(command.userId);
      await this.pageRepo.save(page, context);
    });
  }

  async restore(command: RestorePageCommand): Promise<void> {
    await this.uow.runInTransaction(async (manager) => {
      // Find deleted page by ID directly
      const page = await this.pageRepo.findDeletedById(command.pageId, {
        manager,
      });
      if (!page) {
        throw new NotFoundException('Deleted page not found');
      }

      if (page.getWorkspaceId() !== command.workspaceId) {
        throw new NotFoundException('Deleted page not found in workspace');
      }

      page.restoreDeleted();
      await this.pageRepo.save(page, { manager });
    });
  }

  async permanentlyDelete(
    command: PermanentlyDeletePageCommand,
  ): Promise<void> {
    await this.uow.runInTransaction(async (manager) => {
      const page = await this.pageRepo.findDeletedById(command.pageId, {
        manager,
      });

      if (!page) {
        throw new NotFoundException('Deleted page not found');
      }

      await this.pageRepo.deletePermanently(command.pageId, { manager });
    });
  }
}
