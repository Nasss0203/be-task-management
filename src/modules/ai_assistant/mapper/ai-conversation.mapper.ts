import { AiConversation } from '../domain/entities/ai-conversation.entity';
import { AiConversationModel } from '../domain/models/ai-conversation.model';
import { AiConversationResponseDto } from '../dto/response/ai-conversation.response.dto';
import { SaveAiConversationInput } from '../interfaces/repositories/ai-conversation.repository.interface';

export class AiConversationMapper {
  static toModel(entity: AiConversation): AiConversationModel {
    return new AiConversationModel(
      entity.id,
      entity.userId,
      entity.workspaceId ?? null,
      entity.title,
      entity.lastMessageAt ?? null,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(
    model: AiConversationModel | SaveAiConversationInput,
  ): AiConversation {
    const e = new AiConversation();

    if ('id' in model && model.id != null) e.id = model.id;
    e.userId = model.userId;
    e.workspaceId = model.workspaceId ?? null;
    e.title = model.title;
    e.lastMessageAt = model.lastMessageAt ?? null;
    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;

    return e;
  }

  static toResponse(model: AiConversationModel): AiConversationResponseDto {
    return {
      id: model.id,
      userId: model.userId,
      workspaceId: model.workspaceId,
      title: model.title,
      lastMessageAt: model.lastMessageAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
