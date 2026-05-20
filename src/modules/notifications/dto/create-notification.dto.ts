import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from '../domain/entities/notification.entity';

export class CreateNotificationDto {
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
