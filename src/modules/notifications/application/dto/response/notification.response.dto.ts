import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from '../../../domain/entities/notification.entity';
import { NotificationModel } from '../../../domain/entities/notification.entity';

export class NotificationResponseDto {
  static fromModel(model: NotificationModel): NotificationResponseDto {
    return {
      id: model.id,
      receiverId: model.receiverId,
      senderType: model.senderType,
      actorId: model.actorId,
      sourceType: model.sourceType,
      sourceId: model.sourceId,
      workspaceId: model.workspaceId,
      type: model.type,
      title: model.title,
      message: model.message,
      actionUrl: model.actionUrl,
      metadata: model.metadata,
      readAt: model.readAt,
      archivedAt: model.archivedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
  id: string;

  receiverId: string;

  senderType: NotificationSenderType;
  actorId: string | null;

  sourceType: NotificationSourceType;
  sourceId: string | null;

  workspaceId: string | null;

  type: NotificationType;

  title: string;
  message: string | null;
  actionUrl: string | null;

  metadata: Record<string, unknown> | null;

  readAt: Date | null;
  archivedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
