import { Inject, Injectable } from '@nestjs/common';
import { AiConversationResponseDto } from '../dto/response/ai-conversation.response.dto';
import { ListAiConversationsApplication } from '../interfaces/applications/list-ai-conversations.application.interface';
import { type AiConversationService } from '../interfaces/services/ai-conversation.service.interface';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';
import { AiConversationMapper } from '../mapper/ai-conversation.mapper';

@Injectable()
export class ListAiConversationsApplicationImpl implements ListAiConversationsApplication {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationService)
    private readonly conversationService: AiConversationService,
  ) {}

  async list(userId: string): Promise<AiConversationResponseDto[]> {
    const conversations = await this.conversationService.listByUserId(userId);

    return conversations.map((conversation) =>
      AiConversationMapper.toResponse(conversation),
    );
  }
}
