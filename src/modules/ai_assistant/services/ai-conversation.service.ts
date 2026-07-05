import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AiConversationModel } from '../domain/models/ai-conversation.model';
import { type AiConversationRepository } from '../interfaces/repositories/ai-conversation.repository.interface';
import { AiConversationService } from '../interfaces/services/ai-conversation.service.interface';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';

@Injectable()
export class AiConversationServiceImpl implements AiConversationService {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly repo: AiConversationRepository,
  ) {}

  create(
    input: Parameters<AiConversationService['create']>[0],
    manager?: EntityManager,
  ): Promise<AiConversationModel> {
    const title = input.dto.title?.trim() || 'New conversation';

    return this.repo.create(
      {
        userId: input.userId,
        workspaceId: input.dto.workspaceId ?? null,
        title,
        lastMessageAt: null,
      },
      manager,
    );
  }

  async findByIdForUser(
    conversationId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<AiConversationModel> {
    const conversation = await this.repo.findByIdAndUserId(
      conversationId,
      userId,
      manager,
    );

    if (!conversation) {
      throw new NotFoundException('AI conversation not found');
    }

    return conversation;
  }

  listByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<AiConversationModel[]> {
    return this.repo.listByUserId(userId, manager);
  }

  update(
    input: Parameters<AiConversationService['update']>[0],
    manager?: EntityManager,
  ): Promise<AiConversationModel> {
    return this.repo.update(input, manager);
  }
}
