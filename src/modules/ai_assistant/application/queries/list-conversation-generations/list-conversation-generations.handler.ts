import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { AiGenerationResponseDto } from '../../dto/response/ai-generation.response.dto';
import type { AiHistoryPageResponseDto } from '../../dto/response/ai-history-page.response.dto';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { decodeAiHistoryCursor, encodeAiHistoryCursor } from '../ai-history-cursor';
import { ListConversationGenerationsQuery } from './list-conversation-generations.query';

@Injectable()
export class ListConversationGenerationsHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly accessService: AiConversationAccessService,
  ) {}

  async execute(
    query: ListConversationGenerationsQuery,
  ): Promise<AiHistoryPageResponseDto<AiGenerationResponseDto>> {
    const conversation = await this.conversationRepository.findByIdAndUserId(
      query.conversationId,
      query.userId,
    );
    if (!conversation) throw new NotFoundException('AI conversation not found');
    await this.accessService.assertCanRead(
      conversation,
      query.userId,
      query.shareToken,
    );
    const limit = Math.min(Math.max(query.options.limit ?? 50, 1), 100);
    const generations = await this.generationRepository.findPageByConversationId(
      query.conversationId,
      {
        limit: limit + 1,
        cursor: query.options.cursor
          ? decodeAiHistoryCursor(query.options.cursor)
          : undefined,
      },
    );
    const batch = generations.slice(0, limit);
    const last = batch[batch.length - 1];
    return {
      items: batch.map((generation) => AiGenerationResponseDto.fromDomain(generation)),
      nextCursor:
        generations.length > limit && last
          ? encodeAiHistoryCursor({
              createdAt: last.getCreatedAt(),
              id: last.getId(),
            })
          : null,
    };
  }
}
