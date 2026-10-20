import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { AiConversationResponseDto } from '../../dto/response/ai-conversation.response.dto';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { GetConversationQuery } from './get-conversation.query';

@Injectable()
export class GetConversationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversationRepository: AiConversationRepository,
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly accessService: AiConversationAccessService,
  ) {}

  async execute(
    query: GetConversationQuery,
  ): Promise<AiConversationResponseDto> {
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

    return AiConversationResponseDto.fromDomain(conversation);
  }
}
