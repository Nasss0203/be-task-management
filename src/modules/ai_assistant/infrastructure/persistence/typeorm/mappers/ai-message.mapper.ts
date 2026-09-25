import { AiMessage } from 'src/modules/ai_assistant/domain/entities/ai-message.entity';
import { AiMessageOrmEntity } from '../entities/ai-message.orm-entity';

export class AiMessageMapper {
  static toDomain(entity: AiMessageOrmEntity): AiMessage {
    return AiMessage.restore({
      id: entity.id,
      conversationId: entity.conversationId,
      role: entity.role,
      content: entity.content,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
    });
  }

  static toOrm(message: AiMessage): AiMessageOrmEntity {
    const entity = new AiMessageOrmEntity();
    entity.id = message.getId();
    entity.conversationId = message.getConversationId();
    entity.role = message.getRole();
    entity.content = message.getContent();
    entity.metadata = message.getMetadata();
    entity.createdAt = message.getCreatedAt();

    return entity;
  }
}
