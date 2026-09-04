import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { PageFavorite } from 'src/modules/content/domain/entities/page-favorite.entity';

import type { PageFavoriteRepository } from 'src/modules/content/domain/repositories/page-favorite.repository';

import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { AddPageFavoriteCommand } from './add-page-favorite.command';

@Injectable()
export class AddPageFavoriteHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageFavoriteRepository)
    private readonly pageFavoriteRepo: PageFavoriteRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: AddPageFavoriteCommand): Promise<void> {
    /**
     * 1. User phải có quyền đọc Page.
     *
     * Không check WorkspaceMember trực tiếp.
     *
     * Sau này AuthorizationService có thể mở rộng:
     *
     * - Workspace access
     * - Teamspace access
     * - Direct Share
     * - Guest
     * - Public Page
     * - Community
     */
    const allowed = await this.authorizationService.authorize({
      userId: command.userId,

      permissions: [PERMISSIONS.PAGE_READ],

      target: {
        type: 'page',
        id: command.pageId,
      },
    });

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to access this page',
      );
    }

    /**
     * 2. Transaction.
     */
    await this.uow.runInTransaction(async (manager) => {
      /**
       * Page phải tồn tại.
       */
      const page = await this.pageRepo.findById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      /**
       * Favorite đã tồn tại?
       *
       * Add Favorite là idempotent.
       */
      const existed = await this.pageFavoriteRepo.exists(
        command.userId,
        command.pageId,
        manager,
      );

      if (existed) {
        return;
      }

      /**
       * Create Favorite.
       */
      const favorite = PageFavorite.create({
        userId: command.userId,
        pageId: command.pageId,
      });

      /**
       * Save.
       */
      await this.pageFavoriteRepo.save(favorite, manager);
    });
  }
}
