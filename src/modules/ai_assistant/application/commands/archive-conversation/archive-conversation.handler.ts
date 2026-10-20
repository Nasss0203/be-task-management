import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { AiConversationResponseDto } from '../../dto/response/ai-conversation.response.dto';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { ArchiveConversationCommand } from './archive-conversation.command';

@Injectable()
export class ArchiveConversationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly accessService: AiConversationAccessService,
  ) {}

  async execute(
    command: ArchiveConversationCommand,
    context?: PersistenceContext,
  ): Promise<AiConversationResponseDto> {
    const conversation = await this.conversationRepository.findByIdAndUserId(
      command.conversationId,
      command.userId,
      context,
    );

    if (!conversation) {
      throw new NotFoundException('AI conversation not found');
    }

    await this.accessService.assertCanRead(
      conversation,
      command.userId,
      command.shareToken,
      context,
    );

    conversation.archive();
    const saved = await this.conversationRepository.save(conversation, context);
    return AiConversationResponseDto.fromDomain(saved);
  }
}
