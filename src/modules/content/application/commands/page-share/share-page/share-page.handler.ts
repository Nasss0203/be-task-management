import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { PageShareStatus } from '../../../../domain/constants/page-share-status.constant';
import { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';
import { PageShare } from '../../../../domain/entities/page-share.entity';

import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';
import type { PageRepository } from '../../../../domain/repositories/page.repository';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageShareDto } from '../../../dto/page-share/page-share.dto';
import { SharePageCommand } from './share-page.command';

@Injectable()
export class SharePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepo: PageShareRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: SharePageCommand): Promise<PageShareDto> {
    /**
     * Không cho phép tự share Page cho chính mình.
     */
    if (command.userId === command.targetUserId) {
      throw new ConflictException('You cannot share a page with yourself');
    }

    /**
     * Actor phải có quyền PAGE_SHARE_ADD
     * để invite user khác vào Page.
     */
    const canShare = await this.authorizationService.authorize({
      userId: command.userId,
      permissions: [PERMISSIONS.PAGE_SHARE_ADD],
      target: {
        type: 'page',
        id: command.pageId,
      },
    });

    if (!canShare) {
      throw new ForbiddenException(
        'You do not have permission to share this page',
      );
    }

    /**
     * FULL_ACCESS là quyền quản lý access cao nhất.
     *
     * Actor phải có PAGE_SHARE_UPDATE
     * mới được cấp FULL_ACCESS cho user khác.
     */
    if (command.accessLevel === ResourceAccessLevel.FULL_ACCESS) {
      const canGrantFullAccess = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.PAGE_SHARE_UPDATE],
        target: {
          type: 'page',
          id: command.pageId,
        },
      });

      if (!canGrantFullAccess) {
        throw new ForbiddenException(
          'You cannot grant full access to this page',
        );
      }
    }

    return this.uow.runInTransaction(async (manager) => {
      /**
       * Đảm bảo Page tồn tại.
       */
      const page = await this.pageRepo.findById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      /**
       * Kiểm tra user đã từng được invite/share
       * trên chính Page này hay chưa.
       */
      const existing = await this.pageShareRepo.findByPageAndUser(
        command.pageId,
        command.targetUserId,
        manager,
      );

      let saved: PageShare;

      if (existing) {
        switch (existing.getStatus()) {
          /**
           * Invitation vẫn đang chờ user xử lý.
           */
          case PageShareStatus.PENDING:
            throw new ConflictException('This user has already been invited');

          /**
           * User đã accept và đang có quyền.
           */
          case PageShareStatus.ACCEPTED:
            throw new ConflictException(
              'Page is already shared with this user',
            );

          /**
           * User từng reject.
           *
           * Cho phép Owner/actor invite lại,
           * đồng thời có thể chọn access level mới.
           */
          case PageShareStatus.REJECTED:
            existing.reopenInvitation(command.accessLevel);

            saved = await this.pageShareRepo.save(existing, manager);

            break;

          default:
            throw new ConflictException('Invalid page share status');
        }
      } else {
        /**
         * Invitation mới.
         *
         * Owner đã chọn accessLevel trước,
         * nhưng quyền chưa có hiệu lực cho tới
         * khi target user Accept.
         */
        const pageShare = PageShare.create({
          pageId: command.pageId,
          userId: command.targetUserId,
          accessLevel: command.accessLevel,
          status: PageShareStatus.PENDING,
          createdBy: command.userId,
        });

        saved = await this.pageShareRepo.save(pageShare, manager);
      }

      return {
        id: saved.getId(),
        userId: saved.getUserId(),
        accessLevel: saved.getAccessLevel(),
        createdBy: saved.getCreatedBy(),
        createdAt: saved.getCreatedAt(),
        updatedAt: saved.getUpdatedAt(),
      };
    });
  }
}
