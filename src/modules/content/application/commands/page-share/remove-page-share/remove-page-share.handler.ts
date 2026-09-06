import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';

import { RemovePageShareCommand } from './remove-page-share.command';

@Injectable()
export class RemovePageShareHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepository: PageShareRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: RemovePageShareCommand): Promise<void> {
    await this.unitOfWork.runInTransaction(async (manager) => {
      /**
       * 1. Tìm PageShare
       */
      const share = await this.pageShareRepository.findById(
        command.shareId,
        manager,
      );

      if (!share) {
        throw new NotFoundException('Page share not found');
      }

      /**
       * 2. Check quyền quản lý share
       */
      const allowed = await this.authorizationService.authorize({
        userId: command.userId,

        permissions: [PERMISSIONS.PAGE_SHARE_REMOVE],

        target: {
          type: 'page',
          id: share.getPageId(),
        },
      });

      if (!allowed) {
        throw new ForbiddenException(
          'You do not have permission to remove this page share',
        );
      }

      /**
       * 3. Xóa quyền của user khỏi Page
       */
      await this.pageShareRepository.deleteByPageAndUser(
        share.getPageId(),
        share.getUserId(),
        manager,
      );
    });
  }
}
