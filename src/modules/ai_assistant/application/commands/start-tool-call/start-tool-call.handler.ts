import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiToolCall } from '../../../domain/entities/ai-tool-call.entity';
import type { AiToolCallRepository } from '../../../domain/repositories/ai-tool-call.repository';
import { StartToolCallCommand } from './start-tool-call.command';

@Injectable()
export class StartToolCallHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiToolCallRepository)
    private readonly toolCallRepository: AiToolCallRepository,
  ) {}

  async execute(
    command: StartToolCallCommand,
    context?: PersistenceContext,
  ): Promise<AiToolCall> {
    const toolCall = await this.toolCallRepository.findById(
      command.toolCallId,
      context,
    );

    if (!toolCall) {
      throw new NotFoundException('AI tool call not found');
    }

    toolCall.start();
    return this.toolCallRepository.save(toolCall, context);
  }
}
