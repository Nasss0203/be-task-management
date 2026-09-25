import type { AiGenerationData } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';

export class CreateGenerationCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string | null,
    public readonly conversationId: string | null,
    public readonly capability: string,
    public readonly inputData: AiGenerationData,
    public readonly provider: string | null = null,
    public readonly model: string | null = null,
  ) {}
}
