import { randomUUID } from 'crypto';
import { AiToolCallStatus } from '../enums/ai-tool-call-status.enum';
import { InvalidAiToolCallTransitionException } from '../exceptions/invalid-ai-tool-call-transition.exception';

export type AiToolCallData = Record<string, unknown> | null;

interface CreateAiToolCallParams {
  id?: string;
  generationId: string;
  toolName: string;
  status?: AiToolCallStatus;
  arguments?: AiToolCallData;
  resultMetadata?: AiToolCallData;
  durationMs?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RestoreAiToolCallParams {
  id: string;
  generationId: string;
  toolName: string;
  status: AiToolCallStatus;
  arguments: AiToolCallData;
  resultMetadata: AiToolCallData;
  durationMs: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AiToolCall {
  private constructor(
    private readonly id: string,
    private readonly generationId: string,
    private readonly toolName: string,
    private status: AiToolCallStatus,
    private readonly argumentsData: AiToolCallData,
    private resultMetadata: AiToolCallData,
    private durationMs: number | null,
    private errorCode: string | null,
    private errorMessage: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    if (!generationId.trim()) {
      throw new Error('AI tool call generation id is required');
    }

    if (!toolName.trim()) {
      throw new Error('AI tool call name is required');
    }

    if (
      durationMs !== null &&
      (!Number.isInteger(durationMs) || durationMs < 0)
    ) {
      throw new Error('AI tool call duration must be a non-negative integer');
    }
  }

  static create(params: CreateAiToolCallParams): AiToolCall {
    const now = new Date();

    return new AiToolCall(
      params.id ?? randomUUID(),
      params.generationId,
      params.toolName,
      params.status ?? AiToolCallStatus.PENDING,
      params.arguments ?? null,
      params.resultMetadata ?? null,
      params.durationMs ?? null,
      params.errorCode ?? null,
      params.errorMessage ?? null,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static restore(params: RestoreAiToolCallParams): AiToolCall {
    return new AiToolCall(
      params.id,
      params.generationId,
      params.toolName,
      params.status,
      params.arguments,
      params.resultMetadata,
      params.durationMs,
      params.errorCode,
      params.errorMessage,
      params.createdAt,
      params.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getGenerationId(): string {
    return this.generationId;
  }

  getToolName(): string {
    return this.toolName;
  }

  getStatus(): AiToolCallStatus {
    return this.status;
  }

  getArguments(): AiToolCallData {
    return this.argumentsData;
  }

  getResultMetadata(): AiToolCallData {
    return this.resultMetadata;
  }

  getDurationMs(): number | null {
    return this.durationMs;
  }

  getErrorCode(): string | null {
    return this.errorCode;
  }

  getErrorMessage(): string | null {
    return this.errorMessage;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  start(): void {
    this.assertTransition(AiToolCallStatus.RUNNING, [AiToolCallStatus.PENDING]);
    this.status = AiToolCallStatus.RUNNING;
    this.updatedAt = new Date();
  }

  succeed(resultMetadata: AiToolCallData, durationMs: number | null): void {
    this.assertDuration(durationMs);
    this.assertTransition(AiToolCallStatus.SUCCEEDED, [
      AiToolCallStatus.RUNNING,
    ]);

    this.resultMetadata = resultMetadata;
    this.durationMs = durationMs;
    this.errorCode = null;
    this.errorMessage = null;
    this.status = AiToolCallStatus.SUCCEEDED;
    this.updatedAt = new Date();
  }

  fail(
    errorCode: string | null,
    errorMessage: string | null,
    durationMs: number | null,
  ): void {
    this.assertDuration(durationMs);
    this.assertTransition(AiToolCallStatus.FAILED, [AiToolCallStatus.RUNNING]);

    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.durationMs = durationMs;
    this.status = AiToolCallStatus.FAILED;
    this.updatedAt = new Date();
  }

  private assertTransition(
    target: AiToolCallStatus,
    allowedFrom: AiToolCallStatus[],
  ): void {
    if (!allowedFrom.includes(this.status)) {
      throw new InvalidAiToolCallTransitionException(this.status, target);
    }
  }

  private assertDuration(durationMs: number | null): void {
    if (
      durationMs !== null &&
      (!Number.isInteger(durationMs) || durationMs < 0)
    ) {
      throw new Error('AI tool call duration must be a non-negative integer');
    }
  }
}
