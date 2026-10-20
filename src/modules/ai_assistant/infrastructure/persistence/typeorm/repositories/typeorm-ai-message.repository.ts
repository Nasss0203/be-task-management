import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import type { AiMessage } from 'src/modules/ai_assistant/domain/entities/ai-message.entity';
import type {
  AiMessageListOptions,
  AiMessageRepository,
} from 'src/modules/ai_assistant/domain/repositories/ai-message.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AiMessageRole } from 'src/modules/ai_assistant/domain/enums/ai-message-role.enum';
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

  async findFirstUserContentsByConversationIds(
    conversationIds: string[],
    context?: PersistenceContext,
  ): Promise<Map<string, string>> {
    if (conversationIds.length === 0) return new Map();

    const rows = await this.getRepo(context)
      .createQueryBuilder('message')
      .select('message.conversation_id', 'conversationId')
      .addSelect('message.content', 'content')
      .distinctOn(['message.conversation_id'])
      .where('message.conversation_id IN (:...conversationIds)', {
        conversationIds,
      })
      .andWhere('message.role = :role', { role: AiMessageRole.USER })
      .orderBy('message.conversation_id', 'ASC')
      .addOrderBy('message.created_at', 'ASC')
      .addOrderBy('message.id', 'ASC')
      .getRawMany<{ conversationId: string; content: string }>();

    return new Map(rows.map((row) => [row.conversationId, row.content]));
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
      query.andWhere(
        '(message.created_at, message.id) > (:cursorDate, :cursorId)',
        {
          cursorDate: options.cursor.createdAt,
          cursorId: options.cursor.id,
        },
      );
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
