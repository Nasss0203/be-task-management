import { Inject, Injectable } from '@nestjs/common';
import { AiConversationResponseDto } from '../dto/response/ai-conversation.response.dto';
import { CreateAiConversationApplication } from '../interfaces/applications/create-ai-conversation.application.interface';
import { type AiConversationService } from '../interfaces/services/ai-conversation.service.interface';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';
import { AiConversationMapper } from '../mapper/ai-conversation.mapper';

@Injectable()
export class CreateAiConversationApplicationImpl implements CreateAiConversationApplication {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationService)
    private readonly conversationService: AiConversationService,
  ) {}

  async create(
    input: Parameters<CreateAiConversationApplication['create']>[0],
  ): Promise<AiConversationResponseDto> {
    const conversation = await this.conversationService.create(input);

    return AiConversationMapper.toResponse(conversation);
  }
}
