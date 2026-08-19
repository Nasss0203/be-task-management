import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { UnitOfWork } from 'src/interface/index.interface';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

export class DeletePageBlockCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly blockId: string,
    public readonly userId: string,
  ) {}
}

export class RestorePageBlockCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly blockId: string,
    public readonly userId: string,
  ) {}
}

@Injectable()
export class DeletePageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async delete(command: DeletePageBlockCommand): Promise<void> {
    await this.uow.runInTransaction(async (manager) => {
      const block = await this.pageBlockRepo.findById(command.blockId, { manager });
      if (!block) {
        throw new NotFoundException('Page block not found');
      }

      block.markAsDeleted(command.userId);
      await this.pageBlockRepo.save(block, { manager });
      await this.pageBlockRepo.delete(block.getId(), { manager });
    });
  }

  async restore(command: RestorePageBlockCommand): Promise<void> {
    await this.uow.runInTransaction(async (manager) => {
      const deletedBlocks = await this.pageBlockRepo.findDeletedByWorkspace(command.workspaceId, undefined, { manager });
      const block = deletedBlocks.find(b => b.getId() === command.blockId);
      if (!block) {
        throw new NotFoundException('Deleted page block not found');
      }

      block.restoreDeleted();
      await this.pageBlockRepo.save(block, { manager });
    });
  }
}
