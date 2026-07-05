import { EntityManager } from 'typeorm';
import { CreateAiConversationDto } from '../../dto/create-ai-conversation.dto';
import { AiConversationModel } from '../../domain/models/ai-conversation.model';
import { UpdateAiConversationInput } from '../repositories/ai-conversation.repository.interface';

export interface AiConversationService {
  create(
    input: { userId: string; dto: CreateAiConversationDto },
    manager?: EntityManager,
  ): Promise<AiConversationModel>;

  findByIdForUser(
    conversationId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<AiConversationModel>;

  listByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<AiConversationModel[]>;

  update(
    input: UpdateAiConversationInput,
    manager?: EntityManager,
  ): Promise<AiConversationModel>;
}
