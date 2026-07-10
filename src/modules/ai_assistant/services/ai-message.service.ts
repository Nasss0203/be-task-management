import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AiMessageModel } from '../domain/models/ai-message.model';
import { type AiMessageRepository } from '../interfaces/repositories/ai-message.repository.interface';
import { AiMessageService } from '../interfaces/services/ai-message.service.interface';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';

@Injectable()
export class AiMessageServiceImpl implements AiMessageService {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiMessageRepository)
    private readonly repo: AiMessageRepository,
  ) {}

  create(
    input: Parameters<AiMessageService['create']>[0],
    manager?: EntityManager,
  ): Promise<AiMessageModel> {
    return this.repo.create(input, manager);
  }

  listByConversationId(
    conversationId: string,
    manager?: EntityManager,
  ): Promise<AiMessageModel[]> {
    return this.repo.listByConversationId(conversationId, manager);
  }
}
