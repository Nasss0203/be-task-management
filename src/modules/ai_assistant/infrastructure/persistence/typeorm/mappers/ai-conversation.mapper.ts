import { AiConversation } from 'src/modules/ai_assistant/domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationOrmEntity } from '../entities/ai-conversation.orm-entity';

export class AiConversationMapper {
  static toDomain(entity: AiConversationOrmEntity): AiConversation {
    return AiConversation.restore({
      id: entity.id,
      userId: entity.userId,
      workspaceId: entity.workspaceId,
      scope: entity.scope,
      pageId: entity.pageId,
      title: entity.title,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(conversation: AiConversation): AiConversationOrmEntity {
    const entity = new AiConversationOrmEntity();
    entity.id = conversation.getId();
    entity.userId = conversation.getUserId();
    entity.workspaceId = conversation.getWorkspaceId();
    entity.scope = conversation.getScope();
    entity.pageId = conversation.getPageId();
    entity.title = conversation.getTitle();
    entity.status = conversation.getStatus();
    entity.createdAt = conversation.getCreatedAt();
    entity.updatedAt = conversation.getUpdatedAt();

    return entity;
  }
}
