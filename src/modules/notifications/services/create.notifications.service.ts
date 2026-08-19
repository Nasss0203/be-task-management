// src/modules/notifications/services/create-notification.service.impl.ts

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EntityManager } from 'typeorm';
import {
  NotificationSenderType,
  NotificationSourceType,
} from '../domain/entities/notification.entity';
import { NotificationModel } from '../domain/models/notification.model';
import { type CreateNotificationRepository } from '../interfaces/repositories/create.notifications.repository.interface';
import {
  CreateNotificationService,
  CreateNotificationServiceInput,
} from '../interfaces/services/create.notifications.service.interface';
import { NOTIFICATION_TYPES } from '../interfaces/types';

const NOTIFICATION_CREATED_EVENT = 'notification.created';

@Injectable()
export class CreateNotificationServiceImpl implements CreateNotificationService {
  constructor(
    @Inject(NOTIFICATION_TYPES.repositories.CreateNotificationRepository)
    private readonly createNotificationRepository: CreateNotificationRepository,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createNotification(
    input: CreateNotificationServiceInput,
    manager?: EntityManager,
  ): Promise<NotificationModel> {
    if (!input.receiverId) {
      throw new BadRequestException('receiverId is required');
    }

    if (!input.title || input.title.trim() === '') {
      throw new BadRequestException('Notification title is required');
    }

    const notification =
      await this.createNotificationRepository.saveNotification(
        {
          receiverId: input.receiverId,

          senderType: input.senderType ?? NotificationSenderType.SYSTEM,
          actorId: input.actorId ?? null,

          sourceType: input.sourceType ?? NotificationSourceType.SYSTEM,

          workspaceId: input.workspaceId ?? null,
          projectId: input.projectId ?? null,
          taskId: input.taskId ?? null,
          sprintId: input.sprintId ?? null,
          commentId: input.commentId ?? null,

          type: input.type,

          title: input.title.trim(),
          message: input.message ?? null,
          actionUrl: input.actionUrl ?? null,

          metadata: input.metadata ?? null,

          readAt: null,
          archivedAt: null,
        },
        manager,
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

        workspaceId: notification.workspaceId,
        projectId: notification.projectId,
        taskId: notification.taskId,
        sprintId: notification.sprintId,
        commentId: notification.commentId,

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
