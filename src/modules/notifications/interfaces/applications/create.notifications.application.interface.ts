import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from '../../domain/entities/notification.entity';
import { NotificationResponseDto } from '../../dto/response/notification.response.dto';

export interface CreateNotificationApplicationInput {
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

export interface CreateNotificationApplication {
  createNotification(
    input: CreateNotificationApplicationInput,
  ): Promise<NotificationResponseDto>;
}
