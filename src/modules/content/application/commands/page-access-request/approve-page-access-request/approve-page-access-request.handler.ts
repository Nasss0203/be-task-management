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
import { NOTIFICATION_TYPES } from 'src/modules/notifications/notifications.types';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';

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

    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly createNotificationService: CreateNotificationService,

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

        /**
         * 5. User không được có PageShare
         * trực tiếp từ trước.
         */
        const existingShare = await this.pageShareRepository.findByPageAndUser(
          request.getPageId(),
          request.getUserId(),
          manager,
        );

        if (existingShare) {
          throw new ConflictException('User already has a page share');
        }

        /**
         * 6. Approve request.
         */
        request.approve(command.reviewerId);

        /**
         * 7. Tạo quyền thật cho requester.
         *
         * Không cần requester Accept thêm lần nữa.
         */
        const pageShare = PageShare.create({
          pageId: request.getPageId(),
          userId: request.getUserId(),
          accessLevel: command.accessLevel,
          status: PageShareStatus.ACCEPTED,
          createdBy: command.reviewerId,
        });

        const savedShare = await this.pageShareRepository.save(
          pageShare,
          manager,
        );

        const savedRequest = await this.pageAccessRequestRepository.save(
          request,
          manager,
        );

        return {
          requestId: savedRequest.getId(),
          pageId: savedRequest.getPageId(),
          userId: savedRequest.getUserId(),
          status: savedRequest.getStatus(),
          accessLevel: savedShare.getAccessLevel(),

          workspaceId: page.getWorkspaceId(),

          reviewerId: command.reviewerId,
        };
      });

    /**
     * Transaction đã COMMIT.
     *
     * Notification chạy sau commit.
     */
    await this.notifyRequester(result);

    /**
     * Không expose workspaceId/reviewerId
     * chỉ dùng nội bộ.
     */
    return {
      requestId: result.requestId,
      pageId: result.pageId,
      userId: result.userId,
      status: result.status,
      accessLevel: result.accessLevel,
    };
  }

  private async notifyRequester(
    result: ApprovePageAccessRequestInternalResult,
  ): Promise<void> {
    try {
      await this.createNotificationService.createNotification({
        /**
         * Người nhận chính là user đã Request Access.
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
