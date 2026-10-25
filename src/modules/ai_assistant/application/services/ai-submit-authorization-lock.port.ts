import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';

/** DI port for short completion-time locks; never held across runtime execution. */
export abstract class AiSubmitAuthorizationLock {
  abstract lock(
    conversation: AiConversation,
    context: PersistenceContext,
    userId: string,
  ): Promise<void>;
}
