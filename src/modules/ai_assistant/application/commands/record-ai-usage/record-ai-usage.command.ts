export class RecordAiUsageCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string | null,
    public readonly conversationId: string | null,
    public readonly generationId: string | null,
    public readonly provider: string,
    public readonly model: string,
    public readonly promptTokens: number,
    public readonly completionTokens: number,
    public readonly totalTokens: number,
    public readonly estimatedCost: string | null = null,
    public readonly currency: string | null = null,
  ) {}
}
