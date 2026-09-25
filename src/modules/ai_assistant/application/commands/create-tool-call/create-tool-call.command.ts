import type { AiToolCallData } from '../../../domain/entities/ai-tool-call.entity';

export class CreateToolCallCommand {
  constructor(
    public readonly generationId: string,
    public readonly toolName: string,
    public readonly argumentsData: AiToolCallData = null,
  ) {}
}
