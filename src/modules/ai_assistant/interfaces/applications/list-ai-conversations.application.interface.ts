import { AiConversationResponseDto } from '../../dto/response/ai-conversation.response.dto';

export interface ListAiConversationsApplication {
  list(userId: string): Promise<AiConversationResponseDto[]>;
}
