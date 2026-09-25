import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { AiGenerationResponseDto } from '../../dto/response/ai-generation.response.dto';
import { ApplyGenerationCommand } from './apply-generation.command';

@Injectable()
export class ApplyGenerationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,
  ) {}

  async execute(
    command: ApplyGenerationCommand,
    context?: PersistenceContext,
  ): Promise<AiGenerationResponseDto> {
    const generation = await this.generationRepository.findByIdAndUserId(
      command.generationId,
      command.userId,
      context,
    );

    if (!generation) {
      throw new NotFoundException('AI generation not found');
    }

    generation.apply();
    const saved = await this.generationRepository.save(generation, context);
    return AiGenerationResponseDto.fromDomain(saved);
  }
}
