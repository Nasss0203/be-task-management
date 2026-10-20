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

  async findByIdAndUserIdForUpdate(
    id: string,
    userId: string,
    context: PersistenceContext,
  ): Promise<AiGeneration | null> {
    // SELECT FOR UPDATE must run through the caller's transaction manager.
    // A second Confirm/Discard waits and then reads the committed status.
    if (
      !context ||
      typeof (context as EntityManager).getRepository !== 'function'
    ) {
      throw new Error(
        'A transaction context is required to lock an AI generation',
      );
    }

    const entity = await this.getRepo(context).findOne({
      where: { id, userId },
      lock: { mode: 'pessimistic_write' },
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

  async findPageByConversationId(
    conversationId: string,
    options: {
      limit: number;
      cursor?: { createdAt: Date; id: string };
    },
    context?: PersistenceContext,
  ): Promise<AiGeneration[]> {
    const query = this.getRepo(context)
      .createQueryBuilder('generation')
      .where('generation.conversation_id = :conversationId', {
        conversationId,
      });
    if (options.cursor) {
      query.andWhere(
        '(generation.created_at, generation.id) > (:cursorDate, :cursorId)',
        {
          cursorDate: options.cursor.createdAt,
          cursorId: options.cursor.id,
        },
      );
    }
    const entities = await query
      .orderBy('generation.created_at', 'ASC')
      .addOrderBy('generation.id', 'ASC')
      .take(options.limit)
      .getMany();
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
