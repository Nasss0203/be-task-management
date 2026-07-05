import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AiMessage } from '../domain/entities/ai-message.entity';
import { AiMessageModel } from '../domain/models/ai-message.model';
import {
  AiMessageRepository,
  SaveAiMessageInput,
} from '../interfaces/repositories/ai-message.repository.interface';
import { AiMessageMapper } from '../mapper/ai-message.mapper';

@Injectable()
export class AiMessageRepositoryImpl implements AiMessageRepository {
  constructor(
    @InjectRepository(AiMessage)
    private readonly repo: Repository<AiMessage>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<AiMessage> {
    return manager ? manager.getRepository(AiMessage) : this.repo;
  }

  async create(
    input: SaveAiMessageInput,
    manager?: EntityManager,
  ): Promise<AiMessageModel> {
    const saved = await this.getRepo(manager).save(
      AiMessageMapper.toEntity(input),
    );

    return AiMessageMapper.toModel(saved);
  }

  async listByConversationId(
    conversationId: string,
    manager?: EntityManager,
  ): Promise<AiMessageModel[]> {
    const entities = await this.getRepo(manager).find({
      where: { conversationId },
      order: {
        createdAt: 'ASC',
      },
    });

    return entities.map((entity) => AiMessageMapper.toModel(entity));
  }
}
