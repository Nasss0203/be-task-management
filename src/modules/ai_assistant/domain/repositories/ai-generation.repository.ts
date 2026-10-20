import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { AiGeneration } from '../aggregates/ai-generation/ai-generation.aggregate';
import type { AiHistoryCursor } from './ai-history-cursor';

export interface AiGenerationRepository {
  save(
    generation: AiGeneration,
    context?: PersistenceContext,
  ): Promise<AiGeneration>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<AiGeneration | null>;

  findByIdAndUserId(
    id: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<AiGeneration | null>;

  /**
   * Lock the owned generation until the supplied transaction commits or rolls back.
   * Confirm and Discard must check COMPLETED only after acquiring this lock.
   */
  findByIdAndUserIdForUpdate(
    id: string,
    userId: string,
    context: PersistenceContext,
  ): Promise<AiGeneration | null>;

  findByConversationId(
    conversationId: string,
    context?: PersistenceContext,
  ): Promise<AiGeneration[]>;

  findPageByConversationId(
    conversationId: string,
    options: { limit: number; cursor?: AiHistoryCursor },
    context?: PersistenceContext,
  ): Promise<AiGeneration[]>;
}
