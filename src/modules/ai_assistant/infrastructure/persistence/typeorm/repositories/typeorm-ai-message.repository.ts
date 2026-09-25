import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import type { AiMessage } from 'src/modules/ai_assistant/domain/entities/ai-message.entity';
import type {
  AiMessageListOptions,
  AiMessageRepository,
} from 'src/modules/ai_assistant/domain/repositories/ai-message.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AiMessageOrmEntity } from '../entities/ai-message.orm-entity';
import { AiMessageMapper } from '../mappers/ai-message.mapper';

@Injectable()
export class TypeOrmAiMessageRepository implements AiMessageRepository {
  constructor(private readonly dataSource: DataSource) {}

  async save(
    message: AiMessage,
    context?: PersistenceContext,
  ): Promise<AiMessage> {
    const saved = await this.getRepo(context).save(
      AiMessageMapper.toOrm(message),
    );
    return AiMessageMapper.toDomain(saved);
  }

  async findByConversationId(
    conversationId: string,
    options: AiMessageListOptions = {},
    context?: PersistenceContext,
  ): Promise<AiMessage[]> {
    const query = this.getRepo(context)
      .createQueryBuilder('message')
      .where('message.conversation_id = :conversationId', { conversationId });

    if (options.cursor) {
      query.andWhere('message.created_at > :cursor', {
        cursor: new Date(options.cursor),
      });
    }

    const entities = await query
      .orderBy('message.created_at', 'ASC')
      .addOrderBy('message.id', 'ASC')
      .take(options.limit ?? 100)
      .getMany();

    return entities.map((entity) => AiMessageMapper.toDomain(entity));
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<AiMessageOrmEntity> {
    const manager = context as EntityManager | undefined;
    return manager
      ? manager.getRepository(AiMessageOrmEntity)
      : this.dataSource.getRepository(AiMessageOrmEntity);
  }
}
