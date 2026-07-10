// src/modules/notifications/interfaces/repositories/find-notification.repository.interface.ts

import { EntityManager } from 'typeorm';
import {
  NotificationSourceType,
  NotificationType,
} from '../../domain/entities/notification.entity';
import { NotificationModel } from '../../domain/models/notification.model';

export interface FindMyNotificationsRepositoryInput {
  receiverId: string;

  category?: 'human' | 'system';

  unreadOnly?: boolean;

  sourceType?: NotificationSourceType;
  type?: NotificationType;

  workspaceId?: string;
  projectId?: string;
  taskId?: string;

  cursor?: Date;
  limit?: number;
}

export interface NotificationTaskLookupInput {
  receiverId: string;
  type: NotificationType;
  taskId: string;
}

export interface NotificationSprintLookupInput {
  receiverId: string;
  type: NotificationType;
  sprintId: string;
}

export interface FindNotificationRepository {
  findMyNotifications(
    input: FindMyNotificationsRepositoryInput,
    manager?: EntityManager,
  ): Promise<NotificationModel[]>;

  countUnread(receiverId: string, manager?: EntityManager): Promise<number>;

  existsByReceiverTypeAndTask(
    input: NotificationTaskLookupInput,
    manager?: EntityManager,
  ): Promise<boolean>;

  existsByReceiverTypeAndSprint(
    input: NotificationSprintLookupInput,
    manager?: EntityManager,
  ): Promise<boolean>;
}
