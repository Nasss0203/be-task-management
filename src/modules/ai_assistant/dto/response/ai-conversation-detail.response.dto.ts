import { AiConversationResponseDto } from './ai-conversation.response.dto';
import { AiMessageResponseDto } from './ai-message.response.dto';

export class AiConversationDetailResponseDto {
  conversation: AiConversationResponseDto;
  messages: AiMessageResponseDto[];
}
