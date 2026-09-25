import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { AiMessage } from '../entities/ai-message.entity';

export interface AiMessageListOptions {
  limit?: number;
  cursor?: string;
}

export interface AiMessageRepository {
  save(message: AiMessage, context?: PersistenceContext): Promise<AiMessage>;

  findByConversationId(
    conversationId: string,
    options?: AiMessageListOptions,
    context?: PersistenceContext,
  ): Promise<AiMessage[]>;
}
