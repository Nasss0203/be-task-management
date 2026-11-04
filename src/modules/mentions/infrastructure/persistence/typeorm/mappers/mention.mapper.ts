import { Mention } from '../../../../domain/entities/mention.entity';
import { MentionOrmEntity } from '../entities/mention.orm-entity';

export class MentionMapper {
  static toDomain(orm: MentionOrmEntity): Mention {
    return Mention.restore({
      id: orm.id,
      workspaceId: orm.workspaceId,
      mentionerId: orm.mentionerId,
      mentionedUserId: orm.mentionedUserId,
      sourceType: orm.sourceType,
      sourceId: orm.sourceId,
      entityType: orm.entityType,
      entityId: orm.entityId,
      notificationId: orm.notificationId,
      createdAt: orm.createdAt,
    });
  }

  static toOrm(mention: Mention): MentionOrmEntity {
    const orm = new MentionOrmEntity();

    orm.id = mention.getId();
    orm.workspaceId = mention.getWorkspaceId();
    orm.mentionerId = mention.getMentionerId();
    orm.mentionedUserId = mention.getMentionedUserId();
    orm.sourceType = mention.getSourceType();
    orm.sourceId = mention.getSourceId();
    orm.entityType = mention.getEntityType();
    orm.entityId = mention.getEntityId();
    orm.notificationId = mention.getNotificationId();
    orm.createdAt = mention.getCreatedAt();

    return orm;
  }
}
