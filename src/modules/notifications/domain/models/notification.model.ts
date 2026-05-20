// src/modules/notifications/domain/models/notification.model.ts

import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from '../entities/notification.entity';

export class NotificationModel {
  constructor(
    public readonly id: string,

    public readonly receiverId: string,

    public readonly senderType: NotificationSenderType,
    public readonly actorId: string | null,

    public readonly sourceType: NotificationSourceType,

    public readonly workspaceId: string | null,
    public readonly projectId: string | null,
    public readonly taskId: string | null,
    public readonly sprintId: string | null,
    public readonly commentId: string | null,

    public readonly type: NotificationType,

    public readonly title: string,
    public readonly message: string | null,
    public readonly actionUrl: string | null,

    public readonly metadata: Record<string, any> | null,

    public readonly readAt: Date | null,
    public readonly archivedAt: Date | null,

    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
