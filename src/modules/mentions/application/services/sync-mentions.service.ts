import { Inject, Injectable } from '@nestjs/common';
import { type FindUserService } from 'src/modules/identity/application/ports/find-user.service.interface';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import type { CreateNotificationService } from 'src/modules/notifications/application/ports/create-notification.service.port';
import {
  NotificationSenderType,
  type NotificationSourceType,
  type NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/notifications.types';
import { Mention } from '../../domain/entities/mention.entity';
import { MentionEntityType } from '../../domain/enums/mention-entity-type.enum';
import { MentionSourceType } from '../../domain/enums/mention-source-type.enum';
import {
  mentionTokensToText,
  parseMentionedUserIds,
} from '../../domain/mention-token';
import type { MentionRepository } from '../../domain/repositories/mention.repository';
import { MENTION_TYPES } from '../../mentions.types';
import { MentionCandidateService } from './mention-candidate.service';

export interface SyncMentionsInput {
  workspaceId: string;
  pageId: string;
  actorId: string;
  sourceType: MentionSourceType;
  sourceId: string;
  entityType: MentionEntityType;
  entityId: string;
  body: string;
  /** Link mở đúng chỗ được nhắc (page, `#block-…`). */
  actionUrl: string;
  notifyAs: MentionNotificationKind;
}

export interface MentionNotificationKind {
  type: NotificationType;
  sourceType: NotificationSourceType;
  place: string;
}

const MESSAGE_MAX_LENGTH = 140;

@Injectable()
export class SyncMentionsService {
  constructor(
    @Inject(MENTION_TYPES.repositories.MentionRepository)
    private readonly mentionRepo: MentionRepository,
    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly notifications: CreateNotificationService,
    @Inject(IDENTITY_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,
    private readonly candidates: MentionCandidateService,
  ) {}

  /**
   * Ghi lại ai đang được nhắc trong nội dung và báo cho người **mới** được nhắc.
   * Người không được phép (ngoài workspace / teamspace, không xem được page) bị bỏ qua.
   * Trả về id những người vừa được báo.
   */
  async sync(input: SyncMentionsInput): Promise<string[]> {
    const requested = parseMentionedUserIds(input.body).filter(
      (id) => id !== input.actorId,
    );

    const allowed = requested.length
      ? await this.candidates.findAllowed(input.pageId, {
          userIds: requested,
          limit: requested.length,
        })
      : [];
    const allowedIds = new Set(allowed.map((user) => user.id));

    const existing = await this.mentionRepo.findBySource(
      input.sourceType,
      input.sourceId,
    );
    const existingIds = new Set(
      existing.map((mention) => mention.getMentionedUserId()),
    );

    await this.mentionRepo.deleteByIds(
      existing
        .filter((mention) => !allowedIds.has(mention.getMentionedUserId()))
        .map((mention) => mention.getId()),
    );

    const newIds = [...allowedIds].filter((id) => !existingIds.has(id));

    if (newIds.length === 0) return [];

    const actor = await this.findUserService.findUserById(input.actorId);
    const actorName = actor?.username ?? 'Someone';
    const text = mentionTokensToText(input.body);
    const message =
      text.length > MESSAGE_MAX_LENGTH
        ? `${text.slice(0, MESSAGE_MAX_LENGTH - 1)}…`
        : text;

    const mentions = await Promise.all(
      newIds.map(async (userId) => {
        const mention = Mention.create({
          workspaceId: input.workspaceId,
          mentionerId: input.actorId,
          mentionedUserId: userId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          entityType: input.entityType,
          entityId: input.entityId,
        });

        const notification = await this.notifications.createNotification({
          receiverId: userId,
          senderType: NotificationSenderType.USER,
          actorId: input.actorId,
          sourceType: input.notifyAs.sourceType,
          sourceId: input.sourceId,
          workspaceId: input.workspaceId,
          type: input.notifyAs.type,
          title: `${actorName} mentioned you in ${input.notifyAs.place}`,
          message,
          actionUrl: input.actionUrl,
          metadata: {
            pageId: input.pageId,
            entityType: input.entityType,
            entityId: input.entityId,
          },
        });

        mention.attachNotification(notification.id);

        return mention;
      }),
    );

    await this.mentionRepo.saveMany(mentions);

    return newIds;
  }
}
