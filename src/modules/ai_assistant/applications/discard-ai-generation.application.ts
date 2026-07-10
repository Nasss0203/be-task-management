import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { AiGenerationStatus } from '../domain/enums/ai-generation-status.enum';
import { AiGenerationResponseDto } from '../dto/response/ai-generation.response.dto';
import { DiscardAiGenerationApplication } from '../interfaces/applications/discard-ai-generation.application.interface';
import { type AiGenerationService } from '../interfaces/services/ai-generation.service.interface';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';
import { AiGenerationMapper } from '../mapper/ai-generation.mapper';

@Injectable()
export class DiscardAiGenerationApplicationImpl implements DiscardAiGenerationApplication {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.services.AiGenerationService)
    private readonly generationService: AiGenerationService,
  ) {}

  async discard(
    input: Parameters<DiscardAiGenerationApplication['discard']>[0],
  ): Promise<AiGenerationResponseDto> {
    const generation = await this.generationService.findByIdForUser(
      input.generationId,
      input.userId,
    );

    if (generation.status === AiGenerationStatus.APPLIED) {
      throw new ConflictException('Applied AI generation cannot be discarded');
    }

    if (generation.status === AiGenerationStatus.DISCARDED) {
      return AiGenerationMapper.toResponse(generation);
    }

    const updated = await this.generationService.updateStatus({
      id: generation.id,
      userId: input.userId,
      status: AiGenerationStatus.DISCARDED,
    });

    return AiGenerationMapper.toResponse(updated);
  }
}
