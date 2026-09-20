import { Notification } from '../entities/notification.orm-entity';
import {
  NotificationSenderType,
  NotificationSourceType,
} from '../../../../domain/entities/notification.entity';
import { NotificationModel } from '../../../../domain/entities/notification.entity';
import { SaveNotificationInput } from '../../../../domain/repositories/notification.repository';

export class NotificationMapper {
  static toModel(entity: Notification): NotificationModel {
    return new NotificationModel(
      entity.id,

      entity.receiverId,

      entity.senderType,
      entity.actorId ?? null,

      entity.sourceType,
      entity.sourceId ?? null,

      entity.workspaceId ?? null,

      entity.type,

      entity.title,
      entity.message ?? null,
      entity.actionUrl ?? null,

      entity.metadata ?? null,

      entity.readAt ?? null,
      entity.archivedAt ?? null,

      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(
    model: NotificationModel | SaveNotificationInput,
  ): Notification {
    const e = new Notification();

    if (model.id != null) e.id = model.id;

    e.receiverId = model.receiverId;

    e.senderType = model.senderType ?? NotificationSenderType.SYSTEM;
    e.actorId = model.actorId ?? null;

    e.sourceType = model.sourceType ?? NotificationSourceType.SYSTEM;
    e.sourceId = model.sourceId ?? null;

    e.workspaceId = model.workspaceId ?? null;

    e.type = model.type;

    e.title = model.title;
    e.message = model.message ?? null;
    e.actionUrl = model.actionUrl ?? null;

    e.metadata = model.metadata ?? null;

    e.readAt = model.readAt ?? null;
    e.archivedAt = model.archivedAt ?? null;

    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;

    return e;
  }
}
