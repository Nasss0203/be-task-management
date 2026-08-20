import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from '../../domain/entities/notification.entity';
import { NotificationModel } from '../../domain/models/notification.model';

export interface CreateNotificationServiceInput {
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
}

export interface CreateNotificationService {
  createNotification(
    input: CreateNotificationServiceInput,
    context?: PersistenceContext,
  ): Promise<NotificationModel>;
}
