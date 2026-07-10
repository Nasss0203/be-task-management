import { EntityManager } from 'typeorm';
import { AiMessageModel } from '../../domain/models/ai-message.model';
import { SaveAiMessageInput } from '../repositories/ai-message.repository.interface';

export interface AiMessageService {
  create(
    input: SaveAiMessageInput,
    manager?: EntityManager,
  ): Promise<AiMessageModel>;

  listByConversationId(
    conversationId: string,
    manager?: EntityManager,
  ): Promise<AiMessageModel[]>;
}
