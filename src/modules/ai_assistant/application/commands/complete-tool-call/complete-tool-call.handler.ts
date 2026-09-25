import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiToolCall } from '../../../domain/entities/ai-tool-call.entity';
import { AiToolCallStatus } from '../../../domain/enums/ai-tool-call-status.enum';
import type { AiToolCallRepository } from '../../../domain/repositories/ai-tool-call.repository';
import { CompleteToolCallCommand } from './complete-tool-call.command';

@Injectable()
export class CompleteToolCallHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiToolCallRepository)
    private readonly toolCallRepository: AiToolCallRepository,
  ) {}

  async execute(
    command: CompleteToolCallCommand,
    context?: PersistenceContext,
  ): Promise<AiToolCall> {
    const toolCall = await this.toolCallRepository.findById(
      command.toolCallId,
      context,
    );

    if (!toolCall) {
      throw new NotFoundException('AI tool call not found');
    }

    if (command.status === AiToolCallStatus.SUCCEEDED) {
      toolCall.succeed(command.resultMetadata, command.durationMs);
    } else {
      toolCall.fail(
        command.errorCode,
        command.errorMessage,
        command.durationMs,
      );
    }

    return this.toolCallRepository.save(toolCall, context);
  }
}
