import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { CompleteGenerationCommand } from './complete-generation.command';

@Injectable()
export class CompleteGenerationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,
  ) {}

  async execute(
    command: CompleteGenerationCommand,
    context?: PersistenceContext,
  ) {
    const generation = await this.generationRepository.findById(
      command.generationId,
      context,
    );

    if (!generation) {
      throw new NotFoundException('AI generation not found');
    }

    generation.complete({
      outputData: command.outputData,
      provider: command.provider,
      model: command.model,
    });

    return this.generationRepository.save(generation, context);
  }
}
