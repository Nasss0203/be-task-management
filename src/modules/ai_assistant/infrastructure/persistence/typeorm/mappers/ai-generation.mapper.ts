import {
  AiGeneration,
  type AiGenerationData,
} from 'src/modules/ai_assistant/domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiGenerationOrmEntity } from '../entities/ai-generation.orm-entity';

export class AiGenerationMapper {
  static toDomain(entity: AiGenerationOrmEntity): AiGeneration {
    return AiGeneration.restore({
      id: entity.id,
      conversationId: entity.conversationId,
      userId: entity.userId,
      workspaceId: entity.workspaceId,
      capability: entity.capability,
      status: entity.status,
      inputData: entity.inputData as AiGenerationData,
      outputData: entity.outputData as AiGenerationData,
      provider: entity.provider,
      model: entity.model,
      errorCode: entity.errorCode,
      errorMessage: entity.errorMessage,
      appliedAt: entity.appliedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(generation: AiGeneration): AiGenerationOrmEntity {
    const entity = new AiGenerationOrmEntity();
    entity.id = generation.getId();
    entity.conversationId = generation.getConversationId();
    entity.userId = generation.getUserId();
    entity.workspaceId = generation.getWorkspaceId();
    entity.capability = generation.getCapability();
    entity.status = generation.getStatus();
    entity.inputData = generation.getInputData();
    entity.outputData = generation.getOutputData();
    entity.provider = generation.getProvider();
    entity.model = generation.getModel();
    entity.errorCode = generation.getErrorCode();
    entity.errorMessage = generation.getErrorMessage();
    entity.appliedAt = generation.getAppliedAt();
    entity.createdAt = generation.getCreatedAt();
    entity.updatedAt = generation.getUpdatedAt();

    return entity;
  }
}
