import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PersistenceContext } from 'src/shared/domain/persistence-context';
import {
  NotificationSenderType,
  NotificationSourceType,
} from '../../domain/entities/notification.entity';
import { NotificationModel } from '../../domain/entities/notification.entity';
import { type NotificationRepository } from '../../domain/repositories/notification.repository';
import {
  CreateNotificationService,
  CreateNotificationServiceInput,
} from '../ports/create-notification.service.port';
import { NOTIFICATION_TYPES } from '../../notifications.types';

const NOTIFICATION_CREATED_EVENT = 'notification.created';

@Injectable()
export class CreateNotificationServiceImpl implements CreateNotificationService {
  constructor(
    @Inject(NOTIFICATION_TYPES.repositories.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createNotification(
    input: CreateNotificationServiceInput,
    context?: PersistenceContext,
  ): Promise<NotificationModel> {
    if (!input.receiverId) {
      throw new BadRequestException('receiverId is required');
    }

    if (!input.title || input.title.trim() === '') {
      throw new BadRequestException('Notification title is required');
    }

    const notification = await this.notificationRepository.saveNotification(
      {
        receiverId: input.receiverId,

        senderType: input.senderType ?? NotificationSenderType.SYSTEM,
        actorId: input.actorId ?? null,

        sourceType: input.sourceType ?? NotificationSourceType.SYSTEM,
        sourceId: input.sourceId ?? null,

        workspaceId: input.workspaceId ?? null,

        type: input.type,

        title: input.title.trim(),
        message: input.message ?? null,
        actionUrl: input.actionUrl ?? null,

        metadata: input.metadata ?? null,

        readAt: null,
        archivedAt: null,
      },
      context,
    );

    this.eventEmitter.emit(NOTIFICATION_CREATED_EVENT, {
      recipientUserId: notification.receiverId,
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,

        senderType: notification.senderType,
        actorId: notification.actorId,

        sourceType: notification.sourceType,
        sourceId: notification.sourceId,

        workspaceId: notification.workspaceId,

        metadata: notification.metadata,

        isRead: Boolean(notification.readAt),
        readAt: notification.readAt,
        archivedAt: notification.archivedAt,

        createdAt: notification.createdAt,
      },
    });

    return notification;
  }
}
