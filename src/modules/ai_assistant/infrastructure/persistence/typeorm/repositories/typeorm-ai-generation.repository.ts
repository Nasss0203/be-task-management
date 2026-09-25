import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import type { AiGeneration } from 'src/modules/ai_assistant/domain/aggregates/ai-generation/ai-generation.aggregate';
import type { AiGenerationRepository } from 'src/modules/ai_assistant/domain/repositories/ai-generation.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AiGenerationOrmEntity } from '../entities/ai-generation.orm-entity';
import { AiGenerationMapper } from '../mappers/ai-generation.mapper';

@Injectable()
export class TypeOrmAiGenerationRepository implements AiGenerationRepository {
  constructor(private readonly dataSource: DataSource) {}

  async save(
    generation: AiGeneration,
    context?: PersistenceContext,
  ): Promise<AiGeneration> {
    const saved = await this.getRepo(context).save(
      AiGenerationMapper.toOrm(generation),
    );
    return AiGenerationMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<AiGeneration | null> {
    const entity = await this.getRepo(context).findOne({ where: { id } });
    return entity ? AiGenerationMapper.toDomain(entity) : null;
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<AiGeneration | null> {
    const entity = await this.getRepo(context).findOne({
      where: { id, userId },
    });
    return entity ? AiGenerationMapper.toDomain(entity) : null;
  }

  async findByConversationId(
    conversationId: string,
    context?: PersistenceContext,
  ): Promise<AiGeneration[]> {
    const entities = await this.getRepo(context).find({
      where: { conversationId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    return entities.map((entity) => AiGenerationMapper.toDomain(entity));
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<AiGenerationOrmEntity> {
    const manager = context as EntityManager | undefined;
    return manager
      ? manager.getRepository(AiGenerationOrmEntity)
      : this.dataSource.getRepository(AiGenerationOrmEntity);
  }
}
