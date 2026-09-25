import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import type { AiToolCall } from 'src/modules/ai_assistant/domain/entities/ai-tool-call.entity';
import type { AiToolCallRepository } from 'src/modules/ai_assistant/domain/repositories/ai-tool-call.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AiToolCallOrmEntity } from '../entities/ai-tool-call.orm-entity';
import { AiToolCallMapper } from '../mappers/ai-tool-call.mapper';

@Injectable()
export class TypeOrmAiToolCallRepository implements AiToolCallRepository {
  constructor(private readonly dataSource: DataSource) {}

  async save(
    toolCall: AiToolCall,
    context?: PersistenceContext,
  ): Promise<AiToolCall> {
    const saved = await this.getRepo(context).save(
      AiToolCallMapper.toOrm(toolCall),
    );
    return AiToolCallMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<AiToolCall | null> {
    const entity = await this.getRepo(context).findOne({ where: { id } });
    return entity ? AiToolCallMapper.toDomain(entity) : null;
  }

  async findByGenerationId(
    generationId: string,
    context?: PersistenceContext,
  ): Promise<AiToolCall[]> {
    const entities = await this.getRepo(context).find({
      where: { generationId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    return entities.map((entity) => AiToolCallMapper.toDomain(entity));
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<AiToolCallOrmEntity> {
    const manager = context as EntityManager | undefined;
    return manager
      ? manager.getRepository(AiToolCallOrmEntity)
      : this.dataSource.getRepository(AiToolCallOrmEntity);
  }
}
