import { PageAccessRequestStatus } from 'src/modules/content/domain/constants/page-access-request-status.constant';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';
import { PersistenceContext } from 'src/shared/domain/persistence-context';
import {
  NotificationModel,
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from '../entities/notification.entity';

export interface SaveNotificationInput {
  id?: string;
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
  readAt?: Date | null;
  archivedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FindMyNotificationsRepositoryInput {
  receiverId: string;
  category?: 'human' | 'system';
  unreadOnly?: boolean;
  sourceType?: NotificationSourceType;
  sourceId?: string;
  type?: NotificationType;
  workspaceId?: string;
  cursor?: Date;
  limit?: number;
}

export type UpdateInviteNotificationStatusRepositoryInput = {
  inviteId: string;
  inviteStatus: WorkspaceInviteStatus;
};

export type UpdatePageAccessRequestNotificationStatusRepositoryInput = {
  accessRequestId: string;
  status: PageAccessRequestStatus;
  reviewerId: string;
  accessLevel?: string;
};

export interface NotificationRepository {
  saveNotification(
    input: SaveNotificationInput,
    context?: PersistenceContext,
  ): Promise<NotificationModel>;

  findMyNotifications(
    input: FindMyNotificationsRepositoryInput,
    context?: PersistenceContext,
  ): Promise<NotificationModel[]>;

  countUnread(
    receiverId: string,
    context?: PersistenceContext,
  ): Promise<number>;

  updateInviteNotificationStatus(
    input: UpdateInviteNotificationStatusRepositoryInput,
    context?: PersistenceContext,
  ): Promise<number>;

  updatePageAccessRequestNotificationStatus(
    input: UpdatePageAccessRequestNotificationStatusRepositoryInput,
    context?: PersistenceContext,
  ): Promise<number>;

  markAllAsRead(
    receiverId: string,
    context?: PersistenceContext,
  ): Promise<number>;

  markAsRead(
    notificationId: string,
    receiverId: string,
    context?: PersistenceContext,
  ): Promise<number>;
}
