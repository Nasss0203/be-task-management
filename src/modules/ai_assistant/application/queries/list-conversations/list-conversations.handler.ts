import { Inject, Injectable } from '@nestjs/common';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import type { AiMessageRepository } from '../../../domain/repositories/ai-message.repository';
import { AiConversationResponseDto } from '../../dto/response/ai-conversation.response.dto';
import type { AiHistoryPageResponseDto } from '../../dto/response/ai-history-page.response.dto';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { toAiConversationTitle } from '../../services/ai-conversation-title';
import { decodeAiHistoryCursor, encodeAiHistoryCursor } from '../ai-history-cursor';
import { ListConversationsQuery } from './list-conversations.query';

@Injectable()
export class ListConversationsHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    @Inject(AI_ASSISTANT_TYPES.repositories.AiMessageRepository)
    private readonly messageRepository: AiMessageRepository,
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly accessService: AiConversationAccessService,
  ) {}

  async execute(
    query: ListConversationsQuery,
  ): Promise<AiHistoryPageResponseDto<AiConversationResponseDto>> {
    const limit = Math.min(Math.max(query.filters.limit ?? 30, 1), 100);
    const cursor = query.filters.cursor
      ? decodeAiHistoryCursor(query.filters.cursor)
      : undefined;
    const conversations = await this.conversationRepository.findByUserId(
      query.userId,
      { ...query.filters, limit: limit + 1, cursor },
    );
    const batch = conversations.slice(0, limit);
    const allowed = await Promise.all(
      batch.map((conversation) =>
        this.accessService.canRead(
          conversation,
          query.userId,
          query.shareToken,
        ),
      ),
    );
    const visible = batch.filter((_conversation, index) => allowed[index]);
    // Historical GLOBAL chats were saved with a fixed placeholder title.
    // Enrich their responses from the first USER message, without mutating DB.
    const genericIds = visible
      .filter((conversation) =>
        !conversation.getTitle()?.trim() ||
        conversation.getTitle()?.trim() === 'AI Assistant',
      )
      .map((conversation) => conversation.getId());
    const firstUserContents =
      genericIds.length > 0
        ? await this.messageRepository.findFirstUserContentsByConversationIds(
            genericIds,
          )
        : new Map<string, string>();
    const items = visible.map((conversation) => {
      const response = AiConversationResponseDto.fromDomain(conversation);
      const firstMessage = firstUserContents.get(conversation.getId());
      if (firstMessage) {
        response.title = toAiConversationTitle(firstMessage) ?? response.title;
      }
      return response;
    });
    // Continue from the last SCANNED row, not the last authorized row:
    // unauthorized rows must not leak or cause authorized rows to be skipped.
    const lastScanned = batch[batch.length - 1];
    return {
      items,
      nextCursor:
        conversations.length > limit && lastScanned
          ? encodeAiHistoryCursor({
              createdAt: lastScanned.getCreatedAt(),
              id: lastScanned.getId(),
            })
          : null,
    };
  }
}
