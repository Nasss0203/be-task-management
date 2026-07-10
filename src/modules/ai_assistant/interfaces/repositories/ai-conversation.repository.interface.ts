import { EntityManager } from 'typeorm';
import { AiConversationModel } from '../../domain/models/ai-conversation.model';

export type SaveAiConversationInput = {
  id?: string;
  userId: string;
  workspaceId?: string | null;
  title: string;
  lastMessageAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateAiConversationInput = {
  id: string;
  userId: string;
  workspaceId?: string | null;
  title?: string;
  lastMessageAt?: Date | null;
};

export interface AiConversationRepository {
  create(
    input: SaveAiConversationInput,
    manager?: EntityManager,
  ): Promise<AiConversationModel>;

  findByIdAndUserId(
    id: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<AiConversationModel | null>;

  listByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<AiConversationModel[]>;

  update(
    input: UpdateAiConversationInput,
    manager?: EntityManager,
  ): Promise<AiConversationModel>;
}
