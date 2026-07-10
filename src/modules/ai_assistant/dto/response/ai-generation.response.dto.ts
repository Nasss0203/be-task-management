import { AiAppliedResult } from '../../interfaces/types/ai-applied-result.type';
import { AiGenerationStatus } from '../../domain/enums/ai-generation-status.enum';
import { AiGenerationType } from '../../domain/enums/ai-generation-type.enum';
import { AiProvider } from '../../domain/enums/ai-provider.enum';

export class AiGenerationResponseDto {
  id: string;
  userId: string;
  conversationId: string;
  requestMessageId: string | null;
  workspaceId: string | null;
  projectId: string | null;
  boardId: string | null;
  sprintId: string | null;
  generationType: AiGenerationType;
  inputText: string;
  inputContext: Record<string, unknown> | null;
  outputData: Record<string, unknown> | null;
  provider: AiProvider;
  model: string;
  status: AiGenerationStatus;
  appliedResults: AiAppliedResult[] | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  errorMessage: string | null;
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
