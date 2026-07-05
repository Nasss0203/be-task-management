import { CreateAiConversationDto } from '../../dto/create-ai-conversation.dto';
import { AiConversationResponseDto } from '../../dto/response/ai-conversation.response.dto';

export interface CreateAiConversationApplication {
  create(input: {
    userId: string;
    dto: CreateAiConversationDto;
  }): Promise<AiConversationResponseDto>;
}
