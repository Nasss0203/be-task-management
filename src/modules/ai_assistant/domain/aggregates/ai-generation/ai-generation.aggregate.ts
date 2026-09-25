import { randomUUID } from 'crypto';
import { AiGenerationStatus } from '../../enums/ai-generation-status.enum';
import { InvalidAiGenerationTransitionException } from '../../exceptions/invalid-ai-generation-transition.exception';

export type AiGenerationData =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

interface CreateAiGenerationParams {
  id?: string;
  conversationId?: string | null;
  userId: string;
  workspaceId?: string | null;
  capability: string;
  status?: AiGenerationStatus;
  inputData?: AiGenerationData;
  outputData?: AiGenerationData;
  provider?: string | null;
  model?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  appliedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RestoreAiGenerationParams {
  id: string;
  conversationId: string | null;
  userId: string;
  workspaceId: string | null;
  capability: string;
  status: AiGenerationStatus;
  inputData: AiGenerationData;
  outputData: AiGenerationData;
  provider: string | null;
  model: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AiGeneration {
  private constructor(
    private readonly id: string,
    private readonly conversationId: string | null,
    private readonly userId: string,
    private readonly workspaceId: string | null,
    private readonly capability: string,
    private status: AiGenerationStatus,
    private readonly inputData: AiGenerationData,
    private outputData: AiGenerationData,
    private provider: string | null,
    private model: string | null,
    private errorCode: string | null,
    private errorMessage: string | null,
    private appliedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    if (!userId.trim()) {
      throw new Error('AI generation user id is required');
    }

    if (!capability.trim()) {
      throw new Error('AI generation capability is required');
    }

    if (capability.length > 100) {
      throw new Error(
        'AI generation capability must not exceed 100 characters',
      );
    }
  }

  static create(params: CreateAiGenerationParams): AiGeneration {
    const now = new Date();

    return new AiGeneration(
      params.id ?? randomUUID(),
      params.conversationId ?? null,
      params.userId,
      params.workspaceId ?? null,
      params.capability,
      params.status ?? AiGenerationStatus.PROCESSING,
      params.inputData ?? null,
      params.outputData ?? null,
      params.provider ?? null,
      params.model ?? null,
      params.errorCode ?? null,
      params.errorMessage ?? null,
      params.appliedAt ?? null,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static restore(params: RestoreAiGenerationParams): AiGeneration {
    return new AiGeneration(
      params.id,
      params.conversationId,
      params.userId,
      params.workspaceId,
      params.capability,
      params.status,
      params.inputData,
      params.outputData,
      params.provider,
      params.model,
      params.errorCode,
      params.errorMessage,
      params.appliedAt,
      params.createdAt,
      params.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getConversationId(): string | null {
    return this.conversationId;
  }

  getUserId(): string {
    return this.userId;
  }

  getWorkspaceId(): string | null {
    return this.workspaceId;
  }

  getCapability(): string {
    return this.capability;
  }

  getStatus(): AiGenerationStatus {
    return this.status;
  }

  getInputData(): AiGenerationData {
    return this.inputData;
  }

  getOutputData(): AiGenerationData {
    return this.outputData;
  }

  getProvider(): string | null {
    return this.provider;
  }

  getModel(): string | null {
    return this.model;
  }

  getErrorCode(): string | null {
    return this.errorCode;
  }

  getErrorMessage(): string | null {
    return this.errorMessage;
  }

  getAppliedAt(): Date | null {
    return this.appliedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  complete(params: {
    outputData: AiGenerationData;
    provider?: string | null;
    model?: string | null;
  }): void {
    this.assertTransition(AiGenerationStatus.COMPLETED, [
      AiGenerationStatus.PROCESSING,
    ]);

    this.outputData = params.outputData;
    this.provider = params.provider ?? this.provider;
    this.model = params.model ?? this.model;
    this.errorCode = null;
    this.errorMessage = null;
    this.status = AiGenerationStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  fail(errorCode: string | null, errorMessage: string | null): void {
    this.assertTransition(AiGenerationStatus.FAILED, [
      AiGenerationStatus.PROCESSING,
    ]);

    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.status = AiGenerationStatus.FAILED;
    this.updatedAt = new Date();
  }

  apply(appliedAt = new Date()): void {
    this.assertTransition(AiGenerationStatus.APPLIED, [
      AiGenerationStatus.COMPLETED,
    ]);

    this.status = AiGenerationStatus.APPLIED;
    this.appliedAt = appliedAt;
    this.updatedAt = appliedAt;
  }

  discard(): void {
    this.assertTransition(AiGenerationStatus.DISCARDED, [
      AiGenerationStatus.COMPLETED,
    ]);

    this.status = AiGenerationStatus.DISCARDED;
    this.updatedAt = new Date();
  }

  private assertTransition(
    target: AiGenerationStatus,
    allowedFrom: AiGenerationStatus[],
  ): void {
    if (!allowedFrom.includes(this.status)) {
      throw new InvalidAiGenerationTransitionException(this.status, target);
    }
  }
}
