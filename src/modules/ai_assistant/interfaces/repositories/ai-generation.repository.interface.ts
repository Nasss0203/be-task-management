import { EntityManager } from 'typeorm';
import { AiAppliedResult } from '../types/ai-applied-result.type';
import { AiGenerationStatus } from '../../domain/enums/ai-generation-status.enum';
import { AiGenerationType } from '../../domain/enums/ai-generation-type.enum';
import { AiProvider } from '../../domain/enums/ai-provider.enum';
import { AiGenerationModel } from '../../domain/models/ai-generation.model';

export type SaveAiGenerationInput = {
  id?: string;
  userId: string;
  conversationId: string;
  requestMessageId?: string | null;
  workspaceId?: string | null;
  projectId?: string | null;
  boardId?: string | null;
  sprintId?: string | null;
  generationType: AiGenerationType;
  inputText: string;
  inputContext?: Record<string, unknown> | null;
  outputData?: Record<string, unknown> | null;
  provider: AiProvider;
  model: string;
  status?: AiGenerationStatus;
  appliedResults?: AiAppliedResult[] | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  errorMessage?: string | null;
  appliedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateAiGenerationStatusInput = {
  id: string;
  userId: string;
  status: AiGenerationStatus;
  errorMessage?: string | null;
};

export type UpdateAiGenerationAppliedResultsInput = {
  id: string;
  userId: string;
  appliedResults: AiAppliedResult[];
  appliedAt: Date;
  status: AiGenerationStatus.APPLIED;
};

export type UpdateAiGenerationGeneratedResultInput = {
  id: string;
  userId: string;
  outputData: Record<string, unknown>;
  provider: AiProvider;
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  status: AiGenerationStatus.GENERATED;
};

export interface AiGenerationRepository {
  create(
    input: SaveAiGenerationInput,
    manager?: EntityManager,
  ): Promise<AiGenerationModel>;

  findById(
    id: string,
    manager?: EntityManager,
  ): Promise<AiGenerationModel | null>;

  updateStatus(
    input: UpdateAiGenerationStatusInput,
    manager?: EntityManager,
  ): Promise<AiGenerationModel>;

  updateGeneratedResult(
    input: UpdateAiGenerationGeneratedResultInput,
    manager?: EntityManager,
  ): Promise<AiGenerationModel>;

  updateAppliedResults(
    input: UpdateAiGenerationAppliedResultsInput,
    manager?: EntityManager,
  ): Promise<AiGenerationModel>;
}
