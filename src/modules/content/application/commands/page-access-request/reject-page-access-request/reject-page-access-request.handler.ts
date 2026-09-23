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

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageAccessRequestStatus } from '../../../../domain/constants/page-access-request-status.constant';

import type { PageAccessRequestRepository } from '../../../../domain/repositories/page-access-request.repository';

import type { PageRepository } from '../../../../domain/repositories/page.repository';

import { RejectPageAccessRequestCommand } from './reject-page-access-request.command';

export interface RejectPageAccessRequestResult {
  requestId: string;

  pageId: string;

  userId: string;

  status: PageAccessRequestStatus;
}

interface RejectPageAccessRequestInternalResult extends RejectPageAccessRequestResult {
  workspaceId: string;

  reviewerId: string;
}

@Injectable()
export class RejectPageAccessRequestHandler {
  private readonly logger = new Logger(RejectPageAccessRequestHandler.name);

  constructor(
    @Inject(CONTENT_TYPES.repositories.PageAccessRequestRepository)
    private readonly pageAccessRequestRepository: PageAccessRequestRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,

    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly createNotificationService: CreateNotificationService,

    @Inject(NOTIFICATION_TYPES.repositories.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    command: RejectPageAccessRequestCommand,
  ): Promise<RejectPageAccessRequestResult> {
    const result: RejectPageAccessRequestInternalResult =
      await this.unitOfWork.runInTransaction(async (manager) => {
        /**
         * 1. Tìm request.
         */
        const request = await this.pageAccessRequestRepository.findById(
          command.requestId,
          manager,
        );

        if (!request) {
          throw new NotFoundException('Page access request not found');
        }

        /**
         * 2. Chỉ PENDING mới được reject.
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
            'You do not have permission to reject this access request',
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

        /**
         * 5. PENDING -> REJECTED.
         *
         * Không tạo PageShare.
         */
        request.reject(command.reviewerId);

        /**
         * 6. Lưu PageAccessRequest.
         */
        const saved = await this.pageAccessRequestRepository.save(
          request,
          manager,
        );

        /**
         * 7. Đồng bộ notification PAGE_ACCESS_REQUESTED.
         *
         * Sau khi request đã REJECTED thì các reviewer
         * không còn được thấy:
         *
         * - Select access level
         * - Approve
         * - Reject
         *
         * Chạy trong cùng transaction với request.
         */
        await this.notificationRepository.updatePageAccessRequestNotificationStatus(
          {
            accessRequestId: saved.getId(),

            status: saved.getStatus(),

            reviewerId: command.reviewerId,
          },

          manager,
        );

        return {
          requestId: saved.getId(),

          pageId: saved.getPageId(),

          userId: saved.getUserId(),

          status: saved.getStatus(),

          workspaceId: page.getWorkspaceId(),

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
     * Không expose workspaceId/reviewerId.
     */
    return {
      requestId: result.requestId,

      pageId: result.pageId,

      userId: result.userId,

      status: result.status,
    };
  }

  /**
   * Gửi notification cho requester
   * khi access request bị reject.
   */
  private async notifyRequester(
    result: RejectPageAccessRequestInternalResult,
  ): Promise<void> {
    try {
      await this.createNotificationService.createNotification({
        /**
         * Người nhận là user đã Request Access.
         */
        receiverId: result.userId,

        /**
         * Người thực hiện Reject.
         */
        senderType: NotificationSenderType.USER,

        actorId: result.reviewerId,

        sourceType: NotificationSourceType.PAGE,

        sourceId: result.pageId,

        workspaceId: result.workspaceId,

        type: NotificationType.PAGE_ACCESS_REJECTED,

        title: 'Page access rejected',

        metadata: {
          accessRequestId: result.requestId,

          reviewerId: result.reviewerId,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to create page access rejected notification for request ${result.requestId}: ${errorMessage}`,
        stack,
      );
    }
  }
}
