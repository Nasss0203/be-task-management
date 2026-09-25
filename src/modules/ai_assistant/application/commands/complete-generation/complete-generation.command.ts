import type { AiGenerationData } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';

export class CompleteGenerationCommand {
  constructor(
    public readonly generationId: string,
    public readonly outputData: AiGenerationData,
    public readonly provider: string | null,
    public readonly model: string | null,
  ) {}
}
