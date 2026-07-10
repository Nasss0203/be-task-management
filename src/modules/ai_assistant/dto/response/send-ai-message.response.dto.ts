import { AiGenerationResponseDto } from './ai-generation.response.dto';
import { AiMessageResponseDto } from './ai-message.response.dto';

export class SendAiMessageResponseDto {
  userMessage: AiMessageResponseDto;
  assistantMessage: AiMessageResponseDto | null;
  generation: AiGenerationResponseDto | null;
}
