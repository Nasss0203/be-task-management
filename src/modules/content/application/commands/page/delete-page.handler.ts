import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { UnitOfWork } from 'src/interface/index.interface';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

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
      const page = await this.pageRepo.findById(command.pageId, { manager });
      if (!page) {
        throw new NotFoundException('Page not found');
      }

      // Check workspace
      if (page.getWorkspaceId() !== command.workspaceId) {
        throw new NotFoundException('Page not found in workspace');
      }

      page.markAsDeleted(command.userId);
      await this.pageRepo.save(page, { manager });
      // We also do softDelete in the repo for relation cascades, or the DB handles it?
      // TypeORM softDelete can be called. Or let's just use the repo's delete.
      await this.pageRepo.delete(page.getId(), { manager });
    });
  }

  async restore(command: RestorePageCommand): Promise<void> {
    await this.uow.runInTransaction(async (manager) => {
      // Find deleted page
      const deletedPages = await this.pageRepo.findDeletedByWorkspace(command.workspaceId, { manager });
      const page = deletedPages.find(p => p.getId() === command.pageId);
      if (!page) {
        throw new NotFoundException('Deleted page not found');
      }

      page.restoreDeleted();
      await this.pageRepo.save(page, { manager });
    });
  }
}
