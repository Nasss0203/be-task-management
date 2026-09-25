import type { AiToolCallData } from '../../../domain/entities/ai-tool-call.entity';
import { AiToolCallStatus } from '../../../domain/enums/ai-tool-call-status.enum';

export type CompletedAiToolCallStatus =
  | AiToolCallStatus.SUCCEEDED
  | AiToolCallStatus.FAILED;

export class CompleteToolCallCommand {
  constructor(
    public readonly toolCallId: string,
    public readonly status: CompletedAiToolCallStatus,
    public readonly resultMetadata: AiToolCallData,
    public readonly durationMs: number | null,
    public readonly errorCode: string | null = null,
    public readonly errorMessage: string | null = null,
  ) {}
}
