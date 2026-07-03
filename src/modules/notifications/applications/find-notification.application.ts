// src/modules/notifications/applications/find-notification.application.impl.ts

import { Inject, Injectable } from '@nestjs/common';
import { NotificationResponseDto } from '../dto/response/notification.response.dto';
import {
  FindMyNotificationsApplicationInput,
  FindNotificationApplication,
} from '../interfaces/applications/find-notification.application.interface';
import { type FindNotificationService } from '../interfaces/services/find-notification.service.interface';
import { NOTIFICATION_TYPES } from '../interfaces/types';
import { NotificationMapper } from '../mapper/notifications.mapper';

@Injectable()
export class FindNotificationApplicationImpl implements FindNotificationApplication {
  constructor(
    @Inject(NOTIFICATION_TYPES.services.FindNotificationService)
    private readonly findNotificationService: FindNotificationService,
  ) {}

  async findMyNotifications(
    input: FindMyNotificationsApplicationInput,
  ): Promise<NotificationResponseDto[]> {
    const notifications =
      await this.findNotificationService.findMyNotifications({
        userId: input.userId,

        category: input.category,

        unreadOnly: input.unreadOnly ?? false,

        sourceType: input.sourceType,
        type: input.type,

        workspaceId: input.workspaceId,
        projectId: input.projectId,
        taskId: input.taskId,

        cursor: input.cursor ? new Date(input.cursor) : undefined,
        limit: input.limit ? Number(input.limit) : 30,
      });

    return notifications.map(NotificationMapper.toResponse);
  }

  async countUnread(userId: string): Promise<{ count: number }> {
    const count = await this.findNotificationService.countUnread(userId);

    return { count };
  }
}
