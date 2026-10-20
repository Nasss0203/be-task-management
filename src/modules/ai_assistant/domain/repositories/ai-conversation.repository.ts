import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { AiHistoryCursor } from './ai-history-cursor';
import type { AiConversation } from '../aggregates/ai-conversation/ai-conversation.aggregate';
import type { AiConversationScope } from '../enums/ai-conversation-scope.enum';

export interface AiConversationListOptions {
  workspaceId?: string | null;
  scope?: AiConversationScope;
  pageId?: string;
  limit?: number;
  cursor?: AiHistoryCursor;
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
