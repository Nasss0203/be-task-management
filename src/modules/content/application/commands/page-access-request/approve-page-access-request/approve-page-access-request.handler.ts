import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import type { CreateNotificationService } from 'src/modules/notifications/application/ports/create-notification.service.port';

import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';

import type { NotificationRepository } from 'src/modules/notifications/domain/repositories/notification.repository';

import { NOTIFICATION_TYPES } from 'src/modules/notifications/notifications.types';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';

import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';

import { WorkspaceMember } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';

import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';

import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageAccessRequestStatus } from '../../../../domain/constants/page-access-request-status.constant';

import { PageShareStatus } from '../../../../domain/constants/page-share-status.constant';

import { PageShare } from '../../../../domain/entities/page-share.entity';

import type { PageAccessRequestRepository } from '../../../../domain/repositories/page-access-request.repository';

import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';

import type { PageRepository } from '../../../../domain/repositories/page.repository';

import { ApprovePageAccessRequestCommand } from './approve-page-access-request.command';

export interface ApprovePageAccessRequestResult {
  requestId: string;

  pageId: string;

  userId: string;

  status: PageAccessRequestStatus;

  accessLevel: string;
}

interface ApprovePageAccessRequestInternalResult extends ApprovePageAccessRequestResult {
  workspaceId: string;

  reviewerId: string;
}

@Injectable()
export class ApprovePageAccessRequestHandler {
  private readonly logger = new Logger(ApprovePageAccessRequestHandler.name);

  constructor(
    @Inject(CONTENT_TYPES.repositories.PageAccessRequestRepository)
    private readonly pageAccessRequestRepository: PageAccessRequestRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepository: PageShareRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly createNotificationService: CreateNotificationService,

    @Inject(NOTIFICATION_TYPES.repositories.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    command: ApprovePageAccessRequestCommand,
  ): Promise<ApprovePageAccessRequestResult> {
    const result: ApprovePageAccessRequestInternalResult =
      await this.unitOfWork.runInTransaction(async (manager) => {
        /**
         * 1. Tìm access request.
         */
        const request = await this.pageAccessRequestRepository.findById(
          command.requestId,
          manager,
        );

        if (!request) {
          throw new NotFoundException('Page access request not found');
        }

        /**
         * 2. Chỉ PENDING mới được xử lý.
         */
        if (request.getStatus() !== PageAccessRequestStatus.PENDING) {
          throw new ConflictException(
            'Page access request has already been reviewed',
          );
        }

        /**
         * 3. Reviewer phải có PAGE_SHARE_UPDATE.
         */
        const allowed = await this.authorizationService.authorize({
          userId: command.reviewerId,

          permissions: [PERMISSIONS.PAGE_SHARE_UPDATE],

          target: {
            type: 'page',

            id: request.getPageId(),
          },
        });

        if (!allowed) {
          throw new ForbiddenException(
            'You do not have permission to approve this access request',
          );
        }

        /**
         * 4. Lấy Page để lấy workspaceId
         * phục vụ Notification.
         */
        const page = await this.pageRepository.findById(
          request.getPageId(),
          manager,
        );

        if (!page) {
          throw new NotFoundException('Page not found');
        }

        const workspaceId = page.getWorkspaceId();

        /**
         * 5. Kiểm tra requester đã thuộc Workspace chưa.
         */
        const existingMember =
          await this.workspaceMemberRepository.findByWorkspaceAndUser(
            workspaceId,
            request.getUserId(),
            manager,
          );

        /**
         * Requester chưa thuộc Workspace
         * sẽ được thêm dưới dạng Guest.
         *
         * Guest chỉ nhận quyền trên Page
         * thông qua PageShare.
         */
        if (!existingMember) {
          await this.workspaceMemberRepository.save(
            WorkspaceMember.createGuest({
              workspaceId,

              userId: request.getUserId(),
            }),

            manager,
          );
        }

        /**
         * 6. Reuse direct PageShare hiện có
         * để không vi phạm unique(page, user).
         */
        const existingShare = await this.pageShareRepository.findByPageAndUser(
          request.getPageId(),

          request.getUserId(),

          manager,
        );

        let pageShare: PageShare;

        /**
         * 7. Approve request.
         */
        request.approve(command.reviewerId);

        /**
         * 8. Tạo quyền thật cho requester.
         *
         * Không cần requester Accept thêm lần nữa.
         */
        if (!existingShare) {
          pageShare = PageShare.create({
            pageId: request.getPageId(),

            userId: request.getUserId(),

            accessLevel: command.accessLevel,

            status: PageShareStatus.ACCEPTED,

            createdBy: command.reviewerId,
          });
        } else {
          switch (existingShare.getStatus()) {
            case PageShareStatus.PENDING:
              existingShare.changeAccessLevel(command.accessLevel);

              existingShare.accept();

              break;

            case PageShareStatus.REJECTED:
              existingShare.reopenInvitation(command.accessLevel);

              existingShare.accept();

              break;

            case PageShareStatus.ACCEPTED:
              existingShare.changeAccessLevel(command.accessLevel);

              break;
          }

          pageShare = existingShare;
        }

        /**
         * 9. Lưu PageShare.
         */
        const savedShare = await this.pageShareRepository.save(
          pageShare,
          manager,
        );

        /**
         * 10. Lưu PageAccessRequest = APPROVED.
         */
        const savedRequest = await this.pageAccessRequestRepository.save(
          request,
          manager,
        );

        /**
         * 11. Đồng bộ notification PAGE_ACCESS_REQUESTED.
         *
         * Notification cũ của reviewer cần được cập nhật
         * sang APPROVED để frontend không còn hiển thị:
         *
         * - Select
         * - Approve
         * - Reject
         *
         * Chạy cùng transaction với PageAccessRequest
         * để tránh request đã APPROVED nhưng notification
         * vẫn còn PENDING.
         */
        await this.notificationRepository.updatePageAccessRequestNotificationStatus(
          {
            accessRequestId: savedRequest.getId(),

            status: savedRequest.getStatus(),

            reviewerId: command.reviewerId,

            accessLevel: savedShare.getAccessLevel(),
          },

          manager,
        );

        return {
          requestId: savedRequest.getId(),

          pageId: savedRequest.getPageId(),

          userId: savedRequest.getUserId(),

          status: savedRequest.getStatus(),

          accessLevel: savedShare.getAccessLevel(),

          workspaceId,

          reviewerId: command.reviewerId,
        };
      });

    /**
     * Transaction đã COMMIT.
     *
     * Notification mới gửi cho requester
     * được tạo sau commit.
     */
    await this.notifyRequester(result);

    /**
     * Không expose workspaceId / reviewerId
     * vì chỉ dùng nội bộ.
     */
    return {
      requestId: result.requestId,

      pageId: result.pageId,

      userId: result.userId,

      status: result.status,

      accessLevel: result.accessLevel,
    };
  }

  /**
   * Gửi notification cho requester
   * khi access request được approve.
   */
  private async notifyRequester(
    result: ApprovePageAccessRequestInternalResult,
  ): Promise<void> {
    try {
      await this.createNotificationService.createNotification({
        /**
         * Người nhận là user đã Request Access.
         */
        receiverId: result.userId,

        /**
         * Người thực hiện Approve.
         */
        senderType: NotificationSenderType.USER,

        actorId: result.reviewerId,

        sourceType: NotificationSourceType.PAGE,

        sourceId: result.pageId,

        workspaceId: result.workspaceId,

        type: NotificationType.PAGE_ACCESS_APPROVED,

        title: 'Page access approved',

        metadata: {
          accessRequestId: result.requestId,

          reviewerId: result.reviewerId,

          accessLevel: result.accessLevel,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to create page access approved notification for request ${result.requestId}: ${errorMessage}`,
        stack,
      );
    }
  }
}
