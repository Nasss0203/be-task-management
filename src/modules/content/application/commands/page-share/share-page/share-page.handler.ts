import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { WorkspaceMember } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageShareStatus } from '../../../../domain/constants/page-share-status.constant';
import { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';

import { PageShare } from '../../../../domain/entities/page-share.entity';

import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';
import type { PageRepository } from '../../../../domain/repositories/page.repository';

import { PageShareDto } from '../../../dto/page-share/page-share.dto';

import { SharePageCommand } from './share-page.command';

@Injectable()
export class SharePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepo: PageShareRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

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
     * Actor phải có PAGE_SHARE_ADD.
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
       * 1. Đảm bảo Page tồn tại.
       */
      const page = await this.pageRepo.findById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      const workspaceId = page.getWorkspaceId();

      /**
       * 2. Kiểm tra PageShare hiện tại.
       */
      const existing = await this.pageShareRepo.findByPageAndUser(
        command.pageId,
        command.targetUserId,
        manager,
      );

      /**
       * Nếu Page đã được share và đang ACCEPTED,
       * không tạo lại.
       *
       * Muốn thay đổi access level thì dùng
       * endpoint update PageShare hiện có.
       */
      if (existing && existing.getStatus() === PageShareStatus.ACCEPTED) {
        throw new ConflictException('Page is already shared with this user');
      }

      /**
       * 3. Đảm bảo target user có WorkspaceMembership.
       *
       * Direct Page Share không biến user thành MEMBER.
       *
       * Nếu chưa có membership:
       * → tạo GUEST.
       *
       * Nếu đã là GUEST:
       * → giữ nguyên.
       *
       * Nếu đã là MEMBER:
       * → giữ nguyên.
       */
      const existingMembership =
        await this.workspaceMemberRepository.findByWorkspaceAndUser(
          workspaceId,
          command.targetUserId,
          manager,
        );

      if (!existingMembership) {
        const guest = WorkspaceMember.createGuest({
          workspaceId,
          userId: command.targetUserId,
        });

        await this.workspaceMemberRepository.save(guest, manager);
      }

      let saved: PageShare;

      /**
       * 4. Xử lý PageShare.
       *
       * Business mới:
       *
       * Direct Page Share không cần target user Accept.
       * PageShare phải có hiệu lực ngay.
       */
      if (existing) {
        switch (existing.getStatus()) {
          /**
           * Legacy PENDING.
           *
           * Cập nhật access level theo request hiện tại
           * và accept ngay.
           */
          case PageShareStatus.PENDING:
            existing.changeAccessLevel(command.accessLevel);

            existing.accept();

            saved = await this.pageShareRepo.save(existing, manager);

            break;

          /**
           * Legacy REJECTED.
           *
           * Reopen để domain cho phép sử dụng lại share,
           * sau đó accept ngay.
           */
          case PageShareStatus.REJECTED:
            existing.reopenInvitation(command.accessLevel);

            existing.accept();

            saved = await this.pageShareRepo.save(existing, manager);

            break;

          /**
           * ACCEPTED đã được xử lý phía trên.
           */
          case PageShareStatus.ACCEPTED:
            throw new ConflictException(
              'Page is already shared with this user',
            );

          default:
            throw new ConflictException('Invalid page share status');
        }
      } else {
        /**
         * 5. Direct Page Share mới.
         *
         * Không còn PENDING.
         * User có quyền ngay sau transaction commit.
         */
        const pageShare = PageShare.create({
          pageId: command.pageId,

          userId: command.targetUserId,

          accessLevel: command.accessLevel,

          status: PageShareStatus.ACCEPTED,

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
