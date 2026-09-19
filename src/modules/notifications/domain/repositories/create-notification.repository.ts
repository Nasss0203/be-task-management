// src/modules/notifications/interfaces/repositories/notification.repository.interface.ts

import { PersistenceContext } from 'src/shared/domain/persistence-context';
import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from '../entities/notification.entity';
import { NotificationModel } from '../entities/notification.entity';

export interface SaveNotificationInput {
  id?: string;

  receiverId: string;

  senderType?: NotificationSenderType;
  actorId?: string | null;

  sourceType?: NotificationSourceType;

  workspaceId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  sprintId?: string | null;
  commentId?: string | null;

  type: NotificationType;

  title: string;
  message?: string | null;
  actionUrl?: string | null;

  metadata?: Record<string, any> | null;

  readAt?: Date | null;
  archivedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateNotificationRepository {
  saveNotification(
    input: SaveNotificationInput,
    context?: PersistenceContext,
  ): Promise<NotificationModel>;
}
