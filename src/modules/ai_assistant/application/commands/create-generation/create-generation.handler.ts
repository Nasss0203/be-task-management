import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import { AiGeneration } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { CreateGenerationCommand } from './create-generation.command';

@Injectable()
export class CreateGenerationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,
  ) {}

  async execute(
    command: CreateGenerationCommand,
    context?: PersistenceContext,
  ): Promise<AiGeneration> {
    if (command.conversationId) {
      const conversation = await this.conversationRepository.findByIdAndUserId(
        command.conversationId,
        command.userId,
        context,
      );

      if (!conversation) {
        throw new NotFoundException('AI conversation not found');
      }

      if (conversation.getWorkspaceId() !== command.workspaceId) {
        throw new Error('AI generation workspace does not match conversation');
      }
    }

    return this.generationRepository.save(
      AiGeneration.create({
        conversationId: command.conversationId,
        userId: command.userId,
        workspaceId: command.workspaceId,
        capability: command.capability,
        inputData: command.inputData,
        provider: command.provider,
        model: command.model,
      }),
      context,
    );
  }
}
