// src/modules/notifications/interfaces/repositories/find-notification.repository.interface.ts

import { EntityManager } from 'typeorm';
import {
  NotificationSourceType,
  NotificationType,
} from '../../domain/entities/notification.entity';
import { NotificationModel } from '../../domain/models/notification.model';

export interface FindMyNotificationsRepositoryInput {
  receiverId: string;

  unreadOnly?: boolean;

  sourceType?: NotificationSourceType;
  type?: NotificationType;

  workspaceId?: string;
  projectId?: string;
  taskId?: string;

  cursor?: Date;
  limit?: number;
}

export interface FindNotificationRepository {
  findMyNotifications(
    input: FindMyNotificationsRepositoryInput,
    manager?: EntityManager,
  ): Promise<NotificationModel[]>;

  countUnread(receiverId: string, manager?: EntityManager): Promise<number>;
}
