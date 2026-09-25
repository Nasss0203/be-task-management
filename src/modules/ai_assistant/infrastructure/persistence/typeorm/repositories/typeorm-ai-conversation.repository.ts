import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import type { AiConversation } from 'src/modules/ai_assistant/domain/aggregates/ai-conversation/ai-conversation.aggregate';
import type {
  AiConversationListOptions,
  AiConversationRepository,
} from 'src/modules/ai_assistant/domain/repositories/ai-conversation.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AiConversationOrmEntity } from '../entities/ai-conversation.orm-entity';
import { AiConversationMapper } from '../mappers/ai-conversation.mapper';

@Injectable()
export class TypeOrmAiConversationRepository implements AiConversationRepository {
  constructor(private readonly dataSource: DataSource) {}

  async save(
    conversation: AiConversation,
    context?: PersistenceContext,
  ): Promise<AiConversation> {
    const saved = await this.getRepo(context).save(
      AiConversationMapper.toOrm(conversation),
    );

    return AiConversationMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<AiConversation | null> {
    const entity = await this.getRepo(context).findOne({ where: { id } });
    return entity ? AiConversationMapper.toDomain(entity) : null;
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<AiConversation | null> {
    const entity = await this.getRepo(context).findOne({
      where: { id, userId },
    });

    return entity ? AiConversationMapper.toDomain(entity) : null;
  }

  async findByUserId(
    userId: string,
    options: AiConversationListOptions = {},
    context?: PersistenceContext,
  ): Promise<AiConversation[]> {
    const query = this.getRepo(context)
      .createQueryBuilder('conversation')
      .where('conversation.user_id = :userId', { userId });

    if (options.workspaceId === null) {
      query.andWhere('conversation.workspace_id IS NULL');
    } else if (options.workspaceId !== undefined) {
      query.andWhere('conversation.workspace_id = :workspaceId', {
        workspaceId: options.workspaceId,
      });
    }

    if (options.cursor) {
      query.andWhere('conversation.created_at < :cursor', {
        cursor: new Date(options.cursor),
      });
    }

    const entities = await query
      .orderBy('conversation.created_at', 'DESC')
      .addOrderBy('conversation.id', 'DESC')
      .take(options.limit ?? 30)
      .getMany();

    return entities.map((entity) => AiConversationMapper.toDomain(entity));
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<AiConversationOrmEntity> {
    const manager = context as EntityManager | undefined;
    return manager
      ? manager.getRepository(AiConversationOrmEntity)
      : this.dataSource.getRepository(AiConversationOrmEntity);
  }
}
