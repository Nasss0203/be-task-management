import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { FailGenerationCommand } from './fail-generation.command';

@Injectable()
export class FailGenerationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,
  ) {}

  async execute(command: FailGenerationCommand, context?: PersistenceContext) {
    const generation = await this.generationRepository.findById(
      command.generationId,
      context,
    );

    if (!generation) {
      throw new NotFoundException('AI generation not found');
    }

    generation.fail(command.errorCode, command.errorMessage);
    return this.generationRepository.save(generation, context);
  }
}
