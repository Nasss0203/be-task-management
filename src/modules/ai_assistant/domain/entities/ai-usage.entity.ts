import { randomUUID } from 'crypto';

interface CreateAiUsageParams {
  id?: string;
  userId: string;
  workspaceId?: string | null;
  conversationId?: string | null;
  generationId?: string | null;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCost?: string | null;
  currency?: string | null;
  createdAt?: Date;
}

interface RestoreAiUsageParams extends Required<CreateAiUsageParams> {
  id: string;
  workspaceId: string | null;
  conversationId: string | null;
  generationId: string | null;
  estimatedCost: string | null;
  currency: string | null;
  createdAt: Date;
}

export class AiUsage {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly workspaceId: string | null,
    private readonly conversationId: string | null,
    private readonly generationId: string | null,
    private readonly provider: string,
    private readonly model: string,
    private readonly promptTokens: number,
    private readonly completionTokens: number,
    private readonly totalTokens: number,
    private readonly estimatedCost: string | null,
    private readonly currency: string | null,
    private readonly createdAt: Date,
  ) {
    if (!userId.trim()) {
      throw new Error('AI usage user id is required');
    }

    if (!provider.trim()) {
      throw new Error('AI usage provider is required');
    }

    if (!model.trim()) {
      throw new Error('AI usage model is required');
    }

    AiUsage.assertNonNegativeInteger(promptTokens, 'prompt tokens');
    AiUsage.assertNonNegativeInteger(completionTokens, 'completion tokens');
    AiUsage.assertNonNegativeInteger(totalTokens, 'total tokens');

    if (
      estimatedCost !== null &&
      (!Number.isFinite(Number(estimatedCost)) || Number(estimatedCost) < 0)
    ) {
      throw new Error('AI usage estimated cost must be non-negative');
    }
  }

  static create(params: CreateAiUsageParams): AiUsage {
    return new AiUsage(
      params.id ?? randomUUID(),
      params.userId,
      params.workspaceId ?? null,
      params.conversationId ?? null,
      params.generationId ?? null,
      params.provider,
      params.model,
      params.promptTokens ?? 0,
      params.completionTokens ?? 0,
      params.totalTokens ?? 0,
      params.estimatedCost ?? null,
      params.currency ?? null,
      params.createdAt ?? new Date(),
    );
  }

  static restore(params: RestoreAiUsageParams): AiUsage {
    return new AiUsage(
      params.id,
      params.userId,
      params.workspaceId,
      params.conversationId,
      params.generationId,
      params.provider,
      params.model,
      params.promptTokens,
      params.completionTokens,
      params.totalTokens,
      params.estimatedCost,
      params.currency,
      params.createdAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getWorkspaceId(): string | null {
    return this.workspaceId;
  }

  getConversationId(): string | null {
    return this.conversationId;
  }

  getGenerationId(): string | null {
    return this.generationId;
  }

  getProvider(): string {
    return this.provider;
  }

  getModel(): string {
    return this.model;
  }

  getPromptTokens(): number {
    return this.promptTokens;
  }

  getCompletionTokens(): number {
    return this.completionTokens;
  }

  getTotalTokens(): number {
    return this.totalTokens;
  }

  getEstimatedCost(): string | null {
    return this.estimatedCost;
  }

  getCurrency(): string | null {
    return this.currency;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  private static assertNonNegativeInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`AI usage ${field} must be a non-negative integer`);
    }
  }
}
