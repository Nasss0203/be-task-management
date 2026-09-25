import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { AiConversation } from '../aggregates/ai-conversation/ai-conversation.aggregate';

export interface AiConversationListOptions {
  workspaceId?: string | null;
  limit?: number;
  cursor?: string;
}

export interface AiConversationRepository {
  save(
    conversation: AiConversation,
    context?: PersistenceContext,
  ): Promise<AiConversation>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<AiConversation | null>;

  findByIdAndUserId(
    id: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<AiConversation | null>;

  findByUserId(
    userId: string,
    options?: AiConversationListOptions,
    context?: PersistenceContext,
  ): Promise<AiConversation[]>;
}
