import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { AiToolCall } from '../entities/ai-tool-call.entity';

export interface AiToolCallRepository {
  save(toolCall: AiToolCall, context?: PersistenceContext): Promise<AiToolCall>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<AiToolCall | null>;

  findByGenerationId(
    generationId: string,
    context?: PersistenceContext,
  ): Promise<AiToolCall[]>;
}
