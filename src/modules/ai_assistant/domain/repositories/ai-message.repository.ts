import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { AiHistoryCursor } from './ai-history-cursor';
import type { AiMessage } from '../entities/ai-message.entity';

export interface AiMessageListOptions {
  limit?: number;
  cursor?: AiHistoryCursor;
}

export interface AiMessageRepository {
  save(message: AiMessage, context?: PersistenceContext): Promise<AiMessage>;

  /** First USER message for each requested conversation, in one database query. */
  findFirstUserContentsByConversationIds(
    conversationIds: string[],
    context?: PersistenceContext,
  ): Promise<Map<string, string>>;

  findByConversationId(
    conversationId: string,
    options?: AiMessageListOptions,
    context?: PersistenceContext,
  ): Promise<AiMessage[]>;
}
