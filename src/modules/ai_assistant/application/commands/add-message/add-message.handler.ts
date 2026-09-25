import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import { AiMessage } from '../../../domain/entities/ai-message.entity';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import type { AiMessageRepository } from '../../../domain/repositories/ai-message.repository';
import { AddMessageCommand } from './add-message.command';

@Injectable()
export class AddMessageHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    @Inject(AI_ASSISTANT_TYPES.repositories.AiMessageRepository)
    private readonly messageRepository: AiMessageRepository,
  ) {}

  async execute(
    command: AddMessageCommand,
    context?: PersistenceContext,
  ): Promise<AiMessage> {
    const conversation = await this.conversationRepository.findById(
      command.conversationId,
      context,
    );

    if (!conversation) {
      throw new NotFoundException('AI conversation not found');
    }

    return this.messageRepository.save(
      AiMessage.create({
        conversationId: command.conversationId,
        role: command.role,
        content: command.content,
        metadata: command.metadata,
      }),
      context,
    );
  }
}
