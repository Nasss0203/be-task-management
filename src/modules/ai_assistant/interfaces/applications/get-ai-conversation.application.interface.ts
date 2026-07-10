import { AiConversationDetailResponseDto } from '../../dto/response/ai-conversation-detail.response.dto';

export interface GetAiConversationApplication {
  get(input: {
    conversationId: string;
    userId: string;
  }): Promise<AiConversationDetailResponseDto>;
}
