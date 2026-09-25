import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { AiGeneration } from '../aggregates/ai-generation/ai-generation.aggregate';

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

  findByConversationId(
    conversationId: string,
    context?: PersistenceContext,
  ): Promise<AiGeneration[]>;
}
