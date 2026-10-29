import { Inject, Injectable, Logger } from '@nestjs/common';
import { Comment } from 'src/modules/comments/domain/aggregates/comment/comment.aggregate';
import { CommentTargetType } from 'src/modules/comments/domain/enums/comment-target-type.enum';
import { SyncMentionsService } from 'src/modules/mentions/application/services/sync-mentions.service';
import { MentionEntityType } from 'src/modules/mentions/domain/enums/mention-entity-type.enum';
import { MentionSourceType } from 'src/modules/mentions/domain/enums/mention-source-type.enum';
import { mentionTokensToText } from 'src/modules/mentions/domain/mention-token';
import type { MentionRepository } from 'src/modules/mentions/domain/repositories/mention.repository';
import { MENTION_TYPES } from 'src/modules/mentions/mentions.types';
import type { CreateNotificationService } from 'src/modules/notifications/application/ports/create-notification.service.port';
import type { UpdateNotificationService } from 'src/modules/notifications/application/ports/update-notification.service.port';
import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/notifications.types';
import { COMMENT_TYPES } from '../../comments.types';
import type { CommentTargetResolver } from '../ports/comment-target-resolver.port';
import { CommentAuthorService } from './comment-author.service';

const MENTION_ENTITY: Record<CommentTargetType, MentionEntityType> = {
  [CommentTargetType.PAGE]: MentionEntityType.PAGE,
  [CommentTargetType.PAGE_BLOCK]: MentionEntityType.PAGE_BLOCK,
  [CommentTargetType.DATABASE_ROW]: MentionEntityType.DATABASE_ROW,
};

const MESSAGE_MAX_LENGTH = 140;

/**
 * Link mở đúng chỗ của comment:
 * block → cuộn tới block (`#block-…`), block trong task thì mở drawer task trước (`?row=…#block-…`);
 * task → mở drawer của row (`?row=…`); page → page.
 */
export function commentActionUrl(
  comment: Comment,
  blockRowId: string | null = null,
): string {
  const pageUrl = `/page/${comment.getPageId()}`;

  switch (comment.getTargetType()) {
    case CommentTargetType.PAGE_BLOCK:
      return blockRowId
        ? `${pageUrl}?row=${blockRowId}#block-${comment.getTargetId()}`
        : `${pageUrl}#block-${comment.getTargetId()}`;
    case CommentTargetType.DATABASE_ROW:
      return `${pageUrl}?row=${comment.getTargetId()}`;
    default:
      return pageUrl;
  }
}

/** Mention và thông báo trả lời sau khi lưu comment. Lỗi chỉ ghi log, không làm hỏng việc lưu. */
@Injectable()
export class CommentNotificationService {
  private readonly logger = new Logger(CommentNotificationService.name);

  constructor(
    private readonly syncMentions: SyncMentionsService,
    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly notifications: CreateNotificationService,
    private readonly authors: CommentAuthorService,
    @Inject(MENTION_TYPES.repositories.MentionRepository)
    private readonly mentionRepo: MentionRepository,
    @Inject(NOTIFICATION_TYPES.services.UpdateNotificationService)
    private readonly notificationUpdates: UpdateNotificationService,
    @Inject(COMMENT_TYPES.ports.CommentTargetResolver)
    private readonly targets: CommentTargetResolver,
  ) {}

  async afterSave(
    comment: Comment,
    actorId: string,
    parent: Comment | null = null,
  ): Promise<void> {
    try {
      const actionUrl = await this.actionUrl(comment);
      const mentioned = await this.syncMentions.sync({
        workspaceId: comment.getWorkspaceId(),
        pageId: comment.getPageId(),
        actorId,
        sourceType: MentionSourceType.COMMENT,
        sourceId: comment.getId(),
        entityType: MENTION_ENTITY[comment.getTargetType()],
        entityId: comment.getTargetId(),
        body: comment.getBody(),
        actionUrl,
      });

      const parentAuthorId = parent?.getAuthorId();

      // Đã được báo "mentioned" thì không báo thêm "replied"
      if (
        parentAuthorId &&
        parentAuthorId !== actorId &&
        !mentioned.includes(parentAuthorId)
      ) {
        await this.notifyReply(comment, actorId, parentAuthorId, actionUrl);
      }
    } catch (error) {
      this.logger.error(
        `Comment ${comment.getId()} saved but notifications failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** Comment đã xóa: bỏ mention và ẩn thông báo trỏ tới nó (mention, trả lời). */
  async afterDelete(commentIds: string[]): Promise<void> {
    try {
      await this.mentionRepo.deleteBySources(
        MentionSourceType.COMMENT,
        commentIds,
      );
      await this.notificationUpdates.archiveBySources(
        NotificationSourceType.COMMENT,
        commentIds,
      );
    } catch (error) {
      this.logger.error(
        `Comments ${commentIds.join(', ')} deleted but cleanup failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** Comment trên block cần biết block có nằm trong task không để link mở drawer task. */
  private async actionUrl(comment: Comment): Promise<string> {
    if (comment.getTargetType() !== CommentTargetType.PAGE_BLOCK) {
      return commentActionUrl(comment);
    }

    const target = await this.targets.resolve(
      comment.getTargetType(),
      comment.getTargetId(),
    );

    return commentActionUrl(comment, target?.rowId ?? null);
  }

  private async notifyReply(
    comment: Comment,
    actorId: string,
    receiverId: string,
    actionUrl: string,
  ): Promise<void> {
    const authors = await this.authors.findAuthors([actorId]);
    const actorName = authors.get(actorId)?.username ?? 'Someone';
    const text = mentionTokensToText(comment.getBody());

    await this.notifications.createNotification({
      receiverId,
      senderType: NotificationSenderType.USER,
      actorId,
      sourceType: NotificationSourceType.COMMENT,
      sourceId: comment.getId(),
      workspaceId: comment.getWorkspaceId(),
      type: NotificationType.COMMENT_REPLIED,
      title: `${actorName} replied to your comment`,
      message:
        text.length > MESSAGE_MAX_LENGTH
          ? `${text.slice(0, MESSAGE_MAX_LENGTH - 1)}…`
          : text,
      actionUrl,
      metadata: {
        pageId: comment.getPageId(),
        targetType: comment.getTargetType(),
        targetId: comment.getTargetId(),
      },
    });
  }
}
