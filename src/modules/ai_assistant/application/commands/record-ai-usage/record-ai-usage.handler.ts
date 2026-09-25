import { Inject, Injectable } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import { AiUsage } from '../../../domain/entities/ai-usage.entity';
import type { AiUsageRepository } from '../../../domain/repositories/ai-usage.repository';
import { RecordAiUsageCommand } from './record-ai-usage.command';

@Injectable()
export class RecordAiUsageHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiUsageRepository)
    private readonly usageRepository: AiUsageRepository,
  ) {}

  execute(
    command: RecordAiUsageCommand,
    context?: PersistenceContext,
  ): Promise<AiUsage> {
    return this.usageRepository.save(
      AiUsage.create({
        userId: command.userId,
        workspaceId: command.workspaceId,
        conversationId: command.conversationId,
        generationId: command.generationId,
        provider: command.provider,
        model: command.model,
        promptTokens: command.promptTokens,
        completionTokens: command.completionTokens,
        totalTokens: command.totalTokens,
        estimatedCost: command.estimatedCost,
        currency: command.currency,
      }),
      context,
    );
  }
}
