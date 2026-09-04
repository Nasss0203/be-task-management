import { Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import type { PageFavoriteRepository } from 'src/modules/content/domain/repositories/page-favorite.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { RemovePageFavoriteCommand } from './remove-page-favorite.command';

@Injectable()
export class RemovePageFavoriteHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageFavoriteRepository)
    private readonly pageFavoriteRepo: PageFavoriteRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: RemovePageFavoriteCommand): Promise<void> {
    await this.uow.runInTransaction(async (manager) => {
      await this.pageFavoriteRepo.deleteByUserAndPage(
        command.userId,
        command.pageId,
        manager,
      );
    });
  }
}
