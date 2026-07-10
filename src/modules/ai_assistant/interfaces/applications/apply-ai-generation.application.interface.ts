import { ApplyAiGenerationDto } from '../../dto/apply-ai-generation.dto';
import { AiGenerationResponseDto } from '../../dto/response/ai-generation.response.dto';

export interface ApplyAiGenerationApplication {
  apply(input: {
    generationId: string;
    userId: string;
    dto: ApplyAiGenerationDto;
  }): Promise<AiGenerationResponseDto>;
}
