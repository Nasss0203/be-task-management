import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import type { AiMessageRepository } from '../../../domain/repositories/ai-message.repository';
import { AiMessageResponseDto } from '../../dto/response/ai-message.response.dto';
import type { AiHistoryPageResponseDto } from '../../dto/response/ai-history-page.response.dto';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { decodeAiHistoryCursor, encodeAiHistoryCursor } from '../ai-history-cursor';
import { ListConversationMessagesQuery } from './list-conversation-messages.query';

@Injectable()
export class ListConversationMessagesHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    @Inject(AI_ASSISTANT_TYPES.repositories.AiMessageRepository)
    private readonly messageRepository: AiMessageRepository,
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly accessService: AiConversationAccessService,
  ) {}

  async execute(
    query: ListConversationMessagesQuery,
  ): Promise<AiHistoryPageResponseDto<AiMessageResponseDto>> {
    const conversation = await this.conversationRepository.findByIdAndUserId(
      query.conversationId,
      query.userId,
    );

    if (!conversation) {
      throw new NotFoundException('AI conversation not found');
    }

    await this.accessService.assertCanRead(
      conversation,
      query.userId,
      query.shareToken,
    );

    const limit = Math.min(Math.max(query.options.limit ?? 100, 1), 200);
    const messages = await this.messageRepository.findByConversationId(
      query.conversationId,
      {
        limit: limit + 1,
        cursor: query.options.cursor
          ? decodeAiHistoryCursor(query.options.cursor)
          : undefined,
      },
    );
    const batch = messages.slice(0, limit);
    const lastMessage = batch[batch.length - 1];
    return {
      items: batch.map((message) => AiMessageResponseDto.fromDomain(message)),
      nextCursor:
        messages.length > limit && lastMessage
          ? encodeAiHistoryCursor({
              createdAt: lastMessage.getCreatedAt(),
              id: lastMessage.getId(),
            })
          : null,
    };
  }
}
