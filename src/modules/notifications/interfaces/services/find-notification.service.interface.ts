import { EntityManager } from 'typeorm';
import {
  NotificationSourceType,
  NotificationType,
} from '../../domain/entities/notification.entity';
import { NotificationModel } from '../../domain/models/notification.model';

export interface FindMyNotificationsServiceInput {
  userId: string;

  unreadOnly?: boolean;

  sourceType?: NotificationSourceType;
  type?: NotificationType;

  workspaceId?: string;
  projectId?: string;
  taskId?: string;

  cursor?: Date;
  limit?: number;
}

export interface FindNotificationService {
  findMyNotifications(
    input: FindMyNotificationsServiceInput,
    manager?: EntityManager,
  ): Promise<NotificationModel[]>;

  countUnread(userId: string, manager?: EntityManager): Promise<number>;
}
