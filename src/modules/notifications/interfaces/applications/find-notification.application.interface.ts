import {
  NotificationSourceType,
  NotificationType,
} from '../../domain/entities/notification.entity';
import { NotificationResponseDto } from '../../dto/response/notification.response.dto';

export interface FindMyNotificationsApplicationInput {
  userId: string;

  unreadOnly?: boolean;

  sourceType?: NotificationSourceType;
  type?: NotificationType;

  workspaceId?: string;
  projectId?: string;
  taskId?: string;

  cursor?: string;
  limit?: string;
}

export interface FindNotificationApplication {
  findMyNotifications(
    input: FindMyNotificationsApplicationInput,
  ): Promise<NotificationResponseDto[]>;

  countUnread(userId: string): Promise<{ count: number }>;
}
