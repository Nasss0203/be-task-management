import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AiConversation } from '../domain/entities/ai-conversation.entity';
import { AiConversationModel } from '../domain/models/ai-conversation.model';
import {
  AiConversationRepository,
  SaveAiConversationInput,
  UpdateAiConversationInput,
} from '../interfaces/repositories/ai-conversation.repository.interface';
import { AiConversationMapper } from '../mapper/ai-conversation.mapper';

@Injectable()
export class AiConversationRepositoryImpl implements AiConversationRepository {
  constructor(
    @InjectRepository(AiConversation)
    private readonly repo: Repository<AiConversation>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<AiConversation> {
    return manager ? manager.getRepository(AiConversation) : this.repo;
  }

  async create(
    input: SaveAiConversationInput,
    manager?: EntityManager,
  ): Promise<AiConversationModel> {
    const saved = await this.getRepo(manager).save(
      AiConversationMapper.toEntity(input),
    );

    return AiConversationMapper.toModel(saved);
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<AiConversationModel | null> {
    const entity = await this.getRepo(manager).findOne({
      where: { id, userId },
    });

    return entity ? AiConversationMapper.toModel(entity) : null;
  }

  async listByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<AiConversationModel[]> {
    const entities = await this.getRepo(manager).find({
      where: { userId },
      order: {
        lastMessageAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    return entities.map((entity) => AiConversationMapper.toModel(entity));
  }

  async update(
    input: UpdateAiConversationInput,
    manager?: EntityManager,
  ): Promise<AiConversationModel> {
    const repo = this.getRepo(manager);
    const entity = await repo.findOne({
      where: { id: input.id, userId: input.userId },
    });

    if (!entity) {
      throw new NotFoundException('AI conversation not found');
    }

    if (input.workspaceId !== undefined) {
      entity.workspaceId = input.workspaceId ?? null;
    }

    if (input.title !== undefined) {
      entity.title = input.title;
    }

    if (input.lastMessageAt !== undefined) {
      entity.lastMessageAt = input.lastMessageAt ?? null;
    }

    const saved = await repo.save(entity);

    return AiConversationMapper.toModel(saved);
  }
}
