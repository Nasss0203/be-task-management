import { AiGenerationResponseDto } from '../../dto/response/ai-generation.response.dto';

export interface DiscardAiGenerationApplication {
  discard(input: {
    generationId: string;
    userId: string;
  }): Promise<AiGenerationResponseDto>;
}
