import { AiGenerationType } from '../../domain/enums/ai-generation-type.enum';
import { AiExecutionContext } from '../types/ai-execution-context.type';
import { AiGenerationResult } from '../types/ai-generation-result.type';
import { AiProviderContextSnapshot } from '../types/ai-provider-context-snapshot.type';

export interface AiProviderGenerationInput {
  userId: string;
  conversationId: string;
  message: string;
  context: AiExecutionContext;
  contextSnapshot?: AiProviderContextSnapshot;
}

export interface AiProviderService {
  generateWorkspaceDraft(
    input: AiProviderGenerationInput,
  ): Promise<AiGenerationResult>;

  generateProjectDraft(
    input: AiProviderGenerationInput,
  ): Promise<AiGenerationResult>;

  generateTaskDraft(
    input: AiProviderGenerationInput,
  ): Promise<AiGenerationResult>;

  generateWorkspaceTreeDraft(
    input: AiProviderGenerationInput,
  ): Promise<AiGenerationResult>;

  generateSprintPlan(
    input: AiProviderGenerationInput,
  ): Promise<AiGenerationResult>;

  generateSprintSummary(
    input: AiProviderGenerationInput,
  ): Promise<AiGenerationResult>;

  generateDashboardInsight(
    input: AiProviderGenerationInput,
  ): Promise<AiGenerationResult>;

  generateSubtasks(
    title: string,
    description: string,
    existingSubtasks?: string[],
  ): Promise<string[]>;

  classifyIntent(message: string): Promise<AiGenerationType | 'NORMAL'>;
}
