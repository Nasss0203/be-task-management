import { AiToolCall } from 'src/modules/ai_assistant/domain/entities/ai-tool-call.entity';
import { AiToolCallOrmEntity } from '../entities/ai-tool-call.orm-entity';

export class AiToolCallMapper {
  static toDomain(entity: AiToolCallOrmEntity): AiToolCall {
    return AiToolCall.restore({
      id: entity.id,
      generationId: entity.generationId,
      toolName: entity.toolName,
      status: entity.status,
      arguments: entity.arguments,
      resultMetadata: entity.resultMetadata,
      durationMs: entity.durationMs,
      errorCode: entity.errorCode,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(toolCall: AiToolCall): AiToolCallOrmEntity {
    const entity = new AiToolCallOrmEntity();
    entity.id = toolCall.getId();
    entity.generationId = toolCall.getGenerationId();
    entity.toolName = toolCall.getToolName();
    entity.status = toolCall.getStatus();
    entity.arguments = toolCall.getArguments();
    entity.resultMetadata = toolCall.getResultMetadata();
    entity.durationMs = toolCall.getDurationMs();
    entity.errorCode = toolCall.getErrorCode();
    entity.errorMessage = toolCall.getErrorMessage();
    entity.createdAt = toolCall.getCreatedAt();
    entity.updatedAt = toolCall.getUpdatedAt();

    return entity;
  }
}
