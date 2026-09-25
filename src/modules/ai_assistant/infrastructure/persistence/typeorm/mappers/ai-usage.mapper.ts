import { AiUsage } from 'src/modules/ai_assistant/domain/entities/ai-usage.entity';
import { AiUsageOrmEntity } from '../entities/ai-usage.orm-entity';

export class AiUsageMapper {
  static toDomain(entity: AiUsageOrmEntity): AiUsage {
    return AiUsage.restore({
      id: entity.id,
      userId: entity.userId,
      workspaceId: entity.workspaceId,
      conversationId: entity.conversationId,
      generationId: entity.generationId,
      provider: entity.provider,
      model: entity.model,
      promptTokens: entity.promptTokens,
      completionTokens: entity.completionTokens,
      totalTokens: entity.totalTokens,
      estimatedCost: entity.estimatedCost,
      currency: entity.currency,
      createdAt: entity.createdAt,
    });
  }

  static toOrm(usage: AiUsage): AiUsageOrmEntity {
    const entity = new AiUsageOrmEntity();
    entity.id = usage.getId();
    entity.userId = usage.getUserId();
    entity.workspaceId = usage.getWorkspaceId();
    entity.conversationId = usage.getConversationId();
    entity.generationId = usage.getGenerationId();
    entity.provider = usage.getProvider();
    entity.model = usage.getModel();
    entity.promptTokens = usage.getPromptTokens();
    entity.completionTokens = usage.getCompletionTokens();
    entity.totalTokens = usage.getTotalTokens();
    entity.estimatedCost = usage.getEstimatedCost();
    entity.currency = usage.getCurrency();
    entity.createdAt = usage.getCreatedAt();

    return entity;
  }
}
