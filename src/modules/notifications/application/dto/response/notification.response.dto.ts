import { NotificationSenderType, NotificationSourceType, NotificationType } from '../../../domain/entities/notification.entity';
import { NotificationModel } from '../../../domain/entities/notification.entity';

export class NotificationResponseDto {
  static fromModel(model: NotificationModel): NotificationResponseDto {
    return {
      id: model.id,
      receiverId: model.receiverId,
      senderType: model.senderType,
      actorId: model.actorId,
      sourceType: model.sourceType,
      workspaceId: model.workspaceId,
      projectId: model.projectId,
      taskId: model.taskId,
      sprintId: model.sprintId,
      commentId: model.commentId,
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

  workspaceId: string | null;
  projectId: string | null;
  taskId: string | null;
  sprintId: string | null;
  commentId: string | null;

  type: NotificationType;

  title: string;
  message: string | null;
  actionUrl: string | null;

  metadata: Record<string, any> | null;

  readAt: Date | null;
  archivedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
