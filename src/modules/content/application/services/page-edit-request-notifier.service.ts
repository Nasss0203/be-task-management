import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

import type { CreateNotificationService } from 'src/modules/notifications/application/ports/create-notification.service.port';
import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import type { NotificationRepository } from 'src/modules/notifications/domain/repositories/notification.repository';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/notifications.types';
import type { PageAccessReviewerReader } from 'src/modules/permission/application/ports/page-access-reviewer-reader.port';
import { PERMISSION_TYPES } from 'src/modules/permission/permission.types';

import { CONTENT_TYPES } from '../../content.types';
import { PageEditRequestStatus } from '../../domain/constants/page-edit-request-status.constant';
import type { PageEditRequest } from '../../domain/entities/page-edit-request.entity';
import type { PageRepository } from '../../domain/repositories/page.repository';

/**
 * Notification là side effect: lỗi chỉ ghi log,
 * không làm hỏng request / approve / reject.
 */
@Injectable()
export class PageEditRequestNotifier {
  private readonly logger = new Logger(PageEditRequestNotifier.name);

  constructor(
    @Inject(PERMISSION_TYPES.ports.PageAccessReviewerReader)
    private readonly reviewers: PageAccessReviewerReader,

    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly notifications: CreateNotificationService,

    @Inject(NOTIFICATION_TYPES.repositories.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pages: PageRepository,
  ) {}

  /**
   * Gửi tối đa một lần cho mỗi reviewer của mỗi request,
   * nên gửi lại request đang PENDING không tạo notification trùng.
   */
  async notifyReviewers(request: PageEditRequest): Promise<void> {
    try {
      const [reviewerIds, page] = await Promise.all([
        this.reviewers.findReviewerIds(request.getPageId()),
        this.pages.findById(request.getPageId()),
      ]);

      await Promise.all(
        reviewerIds
          .filter((reviewerId) => reviewerId !== request.getUserId())
          .map((reviewerId) =>
            this.notifications.createNotificationOnce(
              deliveryId(request.getId(), reviewerId),
              {
                receiverId: reviewerId,
                senderType: NotificationSenderType.USER,
                actorId: request.getUserId(),
                sourceType: NotificationSourceType.PAGE,
                sourceId: request.getPageId(),
                workspaceId: page?.getWorkspaceId() ?? null,
                type: NotificationType.PAGE_EDIT_REQUESTED,
                title: 'Edit access request',
                message: page
                  ? `Requested edit access to ${page.getTitle() || 'Untitled'}.`
                  : null,
                metadata: {
                  editRequestId: request.getId(),
                  requesterId: request.getUserId(),
                  status: request.getStatus(),
                },
              },
            ),
          ),
      );
    } catch (error) {
      this.logError('requested', request, error);
    }
  }

  async notifyReviewed(
    request: PageEditRequest,
    reviewerId: string,
  ): Promise<void> {
    const approved = request.getStatus() === PageEditRequestStatus.APPROVED;

    try {
      await this.notificationRepository.updatePageEditRequestNotificationStatus(
        {
          editRequestId: request.getId(),
          status: request.getStatus(),
          reviewerId,
        },
      );

      const page = await this.pages.findById(request.getPageId());

      await this.notifications.createNotification({
        receiverId: request.getUserId(),
        senderType: NotificationSenderType.USER,
        actorId: reviewerId,
        sourceType: NotificationSourceType.PAGE,
        sourceId: request.getPageId(),
        workspaceId: page?.getWorkspaceId() ?? null,
        type: approved
          ? NotificationType.PAGE_EDIT_APPROVED
          : NotificationType.PAGE_EDIT_REJECTED,
        title: approved ? 'Edit access approved' : 'Edit access rejected',
        metadata: { editRequestId: request.getId(), reviewerId },
      });
    } catch (error) {
      this.logError(approved ? 'approved' : 'rejected', request, error);
    }
  }

  private logError(
    event: string,
    request: PageEditRequest,
    error: unknown,
  ): void {
    this.logger.error(
      `Failed to send page edit ${event} notification for request ${request.getId()}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      error instanceof Error ? error.stack : undefined,
    );
  }
}

function deliveryId(editRequestId: string, reviewerId: string): string {
  const hex = createHash('sha1')
    .update(`page-edit-request:${editRequestId}:${reviewerId}`)
    .digest('hex');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}
