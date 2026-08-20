import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import {
  NotificationSourceType,
  NotificationType,
} from '../../domain/entities/notification.entity';
import { NotificationModel } from '../../domain/models/notification.model';

export interface FindMyNotificationsServiceInput {
  userId: string;

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

export interface FindNotificationService {
  findMyNotifications(
    input: FindMyNotificationsServiceInput,
    context?: PersistenceContext,
  ): Promise<NotificationModel[]>;

  countUnread(userId: string, context?: PersistenceContext): Promise<number>;
}
