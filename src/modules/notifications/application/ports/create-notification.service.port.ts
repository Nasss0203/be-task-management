import { PersistenceContext } from 'src/shared/domain/persistence-context';

import {
  NotificationModel,
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from '../../domain/entities/notification.entity';

export interface CreateNotificationServiceInput {
  receiverId: string;

  senderType?: NotificationSenderType;
  actorId?: string | null;

  sourceType?: NotificationSourceType;
  sourceId?: string | null;

  workspaceId?: string | null;

  type: NotificationType;

  title: string;
  message?: string | null;
  actionUrl?: string | null;

  metadata?: Record<string, unknown> | null;
}

export interface CreateNotificationService {
  createNotification(
    input: CreateNotificationServiceInput,
    context?: PersistenceContext,
  ): Promise<NotificationModel>;
}
