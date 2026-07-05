import { AiAppliedResult } from '../../interfaces/types/ai-applied-result.type';
import { AiGenerationStatus } from '../enums/ai-generation-status.enum';
import { AiGenerationType } from '../enums/ai-generation-type.enum';
import { AiProvider } from '../enums/ai-provider.enum';

export class AiGenerationModel {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly conversationId: string,
    public readonly requestMessageId: string | null,
    public readonly workspaceId: string | null,
    public readonly projectId: string | null,
    public readonly boardId: string | null,
    public readonly sprintId: string | null,
    public readonly generationType: AiGenerationType,
    public readonly inputText: string,
    public readonly inputContext: Record<string, unknown> | null,
    public readonly outputData: Record<string, unknown> | null,
    public readonly provider: AiProvider,
    public readonly model: string,
    public readonly status: AiGenerationStatus,
    public readonly appliedResults: AiAppliedResult[] | null,
    public readonly inputTokens: number | null,
    public readonly outputTokens: number | null,
    public readonly totalTokens: number | null,
    public readonly errorMessage: string | null,
    public readonly appliedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
