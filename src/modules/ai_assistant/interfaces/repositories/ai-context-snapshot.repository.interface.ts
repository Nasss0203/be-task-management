import { AiExecutionContext } from '../types/ai-execution-context.type';
import { AiProviderContextSnapshot } from '../types/ai-provider-context-snapshot.type';

export type ResolveAiTaskDraftContextInput = {
  workspaceId?: string | null;
  projectId?: string | null;
  boardId?: string | null;
  sprintId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ResolvedAiTaskDraftContext = {
  context: AiExecutionContext & { workspaceId: string };
  contextSnapshot: AiProviderContextSnapshot;
};

export interface AiContextSnapshotRepository {
  resolveTaskDraftContext(
    input: ResolveAiTaskDraftContextInput,
  ): Promise<ResolvedAiTaskDraftContext>;
}
