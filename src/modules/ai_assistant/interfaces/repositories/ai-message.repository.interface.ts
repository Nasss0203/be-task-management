import { EntityManager } from 'typeorm';
import { AiMessageRole } from '../../domain/enums/ai-message-role.enum';
import { AiMessageModel } from '../../domain/models/ai-message.model';

export type SaveAiMessageInput = {
  id?: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  context?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
};

export interface AiMessageRepository {
  create(
    input: SaveAiMessageInput,
    manager?: EntityManager,
  ): Promise<AiMessageModel>;

  listByConversationId(
    conversationId: string,
    manager?: EntityManager,
  ): Promise<AiMessageModel[]>;
}
