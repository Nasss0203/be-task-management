import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import { AiToolCall } from '../../../domain/entities/ai-tool-call.entity';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import type { AiToolCallRepository } from '../../../domain/repositories/ai-tool-call.repository';
import { CreateToolCallCommand } from './create-tool-call.command';

@Injectable()
export class CreateToolCallHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,
    @Inject(AI_ASSISTANT_TYPES.repositories.AiToolCallRepository)
    private readonly toolCallRepository: AiToolCallRepository,
  ) {}

  async execute(
    command: CreateToolCallCommand,
    context?: PersistenceContext,
  ): Promise<AiToolCall> {
    const generation = await this.generationRepository.findById(
      command.generationId,
      context,
    );

    if (!generation) {
      throw new NotFoundException('AI generation not found');
    }

    return this.toolCallRepository.save(
      AiToolCall.create({
        generationId: command.generationId,
        toolName: command.toolName,
        arguments: command.argumentsData,
      }),
      context,
    );
  }
}
