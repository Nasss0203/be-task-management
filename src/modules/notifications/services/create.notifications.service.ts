// src/modules/notifications/services/create-notification.service.impl.ts

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class CreateNotificationServiceImpl implements CreateNotificationService {
  constructor(
    @Inject(NOTIFICATION_TYPES.repositories.CreateNotificationRepository)
    private readonly createNotificationRepository: CreateNotificationRepository,
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

    const create = await this.createNotificationRepository.saveNotification(
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
    console.log('🚀 ~ create~', create);

    return create;
  }
}
