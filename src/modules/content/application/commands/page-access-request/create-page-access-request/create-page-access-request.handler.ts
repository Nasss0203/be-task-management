import {
  ConflictException,
  ForbiddenException,
  GoneException,
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

import type { PageAccessReviewerReader } from 'src/modules/permission/application/ports/page-access-reviewer-reader.port';
import type { PageGeneralAccessReader } from 'src/modules/permission/application/ports/page-general-access-reader.port';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PERMISSION_TYPES } from 'src/modules/permission/permission.types';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PageShareLinkTokenService } from 'src/shared/security/page-share-link-token.service';

import { CONTENT_TYPES } from '../../../../content.types';
import { PageAccessRequest } from '../../../../domain/entities/page-access-request.entity';
import type { PageAccessRequestRepository } from '../../../../domain/repositories/page-access-request.repository';
import type { PageShareLinkRepository } from '../../../../domain/repositories/page-share-link.repository';
import type { PageRepository } from '../../../../domain/repositories/page.repository';

import { CreatePageAccessRequestCommand } from './create-page-access-request.command';

export interface CreatePageAccessRequestResult {
  id: string;
  pageId: string;
  userId: string;
  status: string;
  createdAt: Date;
}

/**
 * Chỉ dùng nội bộ trong Handler.
 *
 * workspaceId cần cho Notification,
 * nhưng không trả ra API response.
 */
interface CreatePageAccessRequestInternalResult extends CreatePageAccessRequestResult {
  workspaceId: string;
}

@Injectable()
export class CreatePageAccessRequestHandler {
  private readonly logger = new Logger(CreatePageAccessRequestHandler.name);

  constructor(
    @Inject(CONTENT_TYPES.repositories.PageAccessRequestRepository)
    private readonly pageAccessRequestRepository: PageAccessRequestRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareLinkRepository)
    private readonly pageShareLinkRepository: PageShareLinkRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepository: PageRepository,

    @Inject(PERMISSION_TYPES.ports.PageGeneralAccessReader)
    private readonly pageGeneralAccessReader: PageGeneralAccessReader,

    @Inject(PERMISSION_TYPES.ports.PageAccessReviewerReader)
    private readonly pageAccessReviewerReader: PageAccessReviewerReader,

    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly createNotificationService: CreateNotificationService,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,

    private readonly pageShareLinkTokenService: PageShareLinkTokenService,
  ) {}

  async execute(
    command: CreatePageAccessRequestCommand,
  ): Promise<CreatePageAccessRequestResult> {
    /**
     * 1. Verify Share Link token.
     */
    const verified = this.pageShareLinkTokenService.verify(command.token);

    if (!verified) {
      throw new ForbiddenException('Invalid share link');
    }

    /**
     * 2 -> 7.
     *
     * Business chính chạy trong transaction.
     */
    const result: CreatePageAccessRequestInternalResult =
      await this.unitOfWork.runInTransaction(async (manager) => {
        /**
         * 2. Kiểm tra Page tồn tại.
         */
        const page = await this.pageRepository.findById(
          command.pageId,
          manager,
        );

        if (!page) {
          throw new NotFoundException('Page not found');
        }

        /**
         * 3. Kiểm tra PageShareLink.
         */
        const shareLink = await this.pageShareLinkRepository.findById(
          verified.linkId,
          manager,
        );

        if (!shareLink) {
          throw new NotFoundException('Share link not found');
        }

        if (shareLink.getRevokedAt()) {
          throw new GoneException('Share link has been revoked');
        }

        const expiresAt = shareLink.getExpiresAt();

        if (expiresAt && expiresAt.getTime() <= Date.now()) {
          throw new GoneException('Share link has expired');
        }

        /**
         * Token của Page A không được dùng
         * để Request Access Page B.
         */
        if (shareLink.getPageId() !== command.pageId) {
          throw new ForbiddenException(
            'Share link does not belong to this page',
          );
        }

        /**
         * 4. Request Access chỉ dùng khi:
         *
         * Only people invited
         * linkAccessLevel = null
         */
        const setting = await this.pageGeneralAccessReader.findByPageId(
          command.pageId,
        );

        const linkAccessLevel = setting?.linkAccessLevel ?? null;

        if (linkAccessLevel !== null) {
          throw new ConflictException(
            'Access request is not required while link access is enabled',
          );
        }

        /**
         * 5. Nếu user đã có quyền đọc Page
         * thì không cần Request Access.
         *
         * Không truyền shareToken.
         */
        const alreadyHasAccess = await this.authorizationService.authorize({
          userId: command.userId,

          permissions: [PERMISSIONS.PAGE_READ],

          target: {
            type: 'page',
            id: command.pageId,
          },
        });

        if (alreadyHasAccess) {
          throw new ConflictException('You already have access to this page');
        }

        /**
         * 6. Không cho tạo nhiều request PENDING.
         */
        const pending =
          await this.pageAccessRequestRepository.findPendingByPageAndUser(
            command.pageId,
            command.userId,
            manager,
          );

        if (pending) {
          throw new ConflictException('Access request is already pending');
        }

        /**
         * 7. Tạo PageAccessRequest.
         *
         * Không tạo PageShare ở đây.
         */
        const request = PageAccessRequest.create({
          pageId: command.pageId,
          userId: command.userId,
        });

        const saved = await this.pageAccessRequestRepository.save(
          request,
          manager,
        );

        return {
          id: saved.getId(),
          pageId: saved.getPageId(),
          userId: saved.getUserId(),
          status: saved.getStatus(),
          createdAt: saved.getCreatedAt(),

          /**
           * Chỉ dùng nội bộ cho Notification.
           */
          workspaceId: page.getWorkspaceId(),
        };
      });

    /**
     * Transaction đã COMMIT ở đây.
     *
     * Notification là side effect.
     */
    await this.notifyReviewers(result);

    /**
     * Chỉ trả public response.
     *
     * Không expose workspaceId.
     */
    return {
      id: result.id,
      pageId: result.pageId,
      userId: result.userId,
      status: result.status,
      createdAt: result.createdAt,
    };
  }

  /**
   * Gửi Notification cho những user
   * có quyền review PageAccessRequest.
   */
  private async notifyReviewers(
    result: CreatePageAccessRequestInternalResult,
  ): Promise<void> {
    try {
      const reviewerIds = await this.pageAccessReviewerReader.findReviewerIds(
        result.pageId,
      );

      /**
       * Không gửi cho chính requester.
       */
      const receivers = reviewerIds.filter(
        (reviewerId) => reviewerId !== result.userId,
      );

      if (receivers.length === 0) {
        return;
      }

      /**
       * Gửi Notification song song.
       *
       * Một Notification lỗi không ảnh hưởng
       * các receiver khác.
       */
      const notificationResults = await Promise.allSettled(
        receivers.map((reviewerId) =>
          this.createNotificationService.createNotification({
            receiverId: reviewerId,

            senderType: NotificationSenderType.USER,

            actorId: result.userId,

            sourceType: NotificationSourceType.PAGE,

            sourceId: result.pageId,

            workspaceId: result.workspaceId,

            type: NotificationType.PAGE_ACCESS_REQUESTED,

            title: 'Page access request',

            metadata: {
              accessRequestId: result.id,

              requesterId: result.userId,

              status: result.status,
            },
          }),
        ),
      );

      /**
       * Log từng Notification thất bại.
       */
      notificationResults.forEach((notificationResult, index) => {
        if (notificationResult.status !== 'rejected') {
          return;
        }

        const reviewerId = receivers[index];

        const reason = notificationResult.reason;

        const errorMessage =
          reason instanceof Error ? reason.message : String(reason);

        const stack = reason instanceof Error ? reason.stack : undefined;

        this.logger.error(
          `Failed to create page access request notification for reviewer ${reviewerId}: ${errorMessage}`,
          stack,
        );
      });
    } catch (error) {
      /**
       * PageAccessRequest đã được commit,
       * nên Notification lỗi không throw lại.
       */
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to notify reviewers for page access request ${result.id}: ${errorMessage}`,
        stack,
      );
    }
  }
}
