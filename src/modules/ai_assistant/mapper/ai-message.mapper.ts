import { AiMessage } from '../domain/entities/ai-message.entity';
import { AiMessageModel } from '../domain/models/ai-message.model';
import { AiMessageResponseDto } from '../dto/response/ai-message.response.dto';
import { SaveAiMessageInput } from '../interfaces/repositories/ai-message.repository.interface';

export class AiMessageMapper {
  static toModel(entity: AiMessage): AiMessageModel {
    return new AiMessageModel(
      entity.id,
      entity.conversationId,
      entity.role,
      entity.content,
      entity.context ?? null,
      entity.metadata ?? null,
      entity.createdAt,
    );
  }

  static toEntity(model: AiMessageModel | SaveAiMessageInput): AiMessage {
    const e = new AiMessage();

    if ('id' in model && model.id != null) e.id = model.id;
    e.conversationId = model.conversationId;
    e.role = model.role;
    e.content = model.content;
    e.context = model.context ?? null;
    e.metadata = model.metadata ?? null;
    if (model.createdAt != null) e.createdAt = model.createdAt;

    return e;
  }

  static toResponse(model: AiMessageModel): AiMessageResponseDto {
    return {
      id: model.id,
      conversationId: model.conversationId,
      role: model.role,
      content: model.content,
      context: model.context,
      metadata: model.metadata,
      createdAt: model.createdAt,
    };
  }
}
