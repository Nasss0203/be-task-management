import type { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { AiConversationStatus } from 'src/modules/ai_assistant/domain/enums/ai-conversation-status.enum';
import { AiGenerationStatus } from 'src/modules/ai_assistant/domain/enums/ai-generation-status.enum';
import { AiMessageRole } from 'src/modules/ai_assistant/domain/enums/ai-message-role.enum';
import { AiToolCallStatus } from 'src/modules/ai_assistant/domain/enums/ai-tool-call-status.enum';
import { AiConversationOrmEntity } from '../entities/ai-conversation.orm-entity';
import { AiGenerationOrmEntity } from '../entities/ai-generation.orm-entity';
import { AiMessageOrmEntity } from '../entities/ai-message.orm-entity';
import { AiToolCallOrmEntity } from '../entities/ai-tool-call.orm-entity';
import { AiUsageOrmEntity } from '../entities/ai-usage.orm-entity';
import { TypeOrmAiConversationRepository } from './typeorm-ai-conversation.repository';
import { TypeOrmAiGenerationRepository } from './typeorm-ai-generation.repository';
import { TypeOrmAiMessageRepository } from './typeorm-ai-message.repository';
import { TypeOrmAiToolCallRepository } from './typeorm-ai-tool-call.repository';
import { TypeOrmAiUsageRepository } from './typeorm-ai-usage.repository';

const createdAt = new Date('2026-01-01T00:00:00.000Z');

function dataSourceWithRepository<T>(repository: Partial<Repository<T>>) {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as DataSource;
}

describe('AI Assistant TypeORM repositories', () => {
  it('scopes conversation lookup by id and user id', async () => {
    const findOne = jest.fn().mockResolvedValue(
      Object.assign(new AiConversationOrmEntity(), {
        id: 'conversation-1',
        userId: 'user-1',
        workspaceId: null,
        title: null,
        status: AiConversationStatus.ACTIVE,
        createdAt,
        updatedAt: createdAt,
      }),
    );
    const repository = new TypeOrmAiConversationRepository(
      dataSourceWithRepository<AiConversationOrmEntity>({ findOne }),
    );

    const result = await repository.findByIdAndUserId(
      'conversation-1',
      'user-1',
    );

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'conversation-1', userId: 'user-1' },
    });
    expect(result?.getUserId()).toBe('user-1');
  });

  it('scopes generation lookup by id and user id', async () => {
    const findOne = jest.fn().mockResolvedValue(
      Object.assign(new AiGenerationOrmEntity(), {
        id: 'generation-1',
        conversationId: null,
        userId: 'user-1',
        workspaceId: null,
        capability: 'CHAT',
        status: AiGenerationStatus.PROCESSING,
        inputData: {},
        outputData: null,
        provider: null,
        model: null,
        errorCode: null,
        errorMessage: null,
        appliedAt: null,
        createdAt,
        updatedAt: createdAt,
      }),
    );
    const repository = new TypeOrmAiGenerationRepository(
      dataSourceWithRepository<AiGenerationOrmEntity>({ findOne }),
    );

    await repository.findByIdAndUserId('generation-1', 'user-1');

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'generation-1', userId: 'user-1' },
    });
  });

  it('orders messages chronologically', async () => {
    const getMany = jest.fn().mockResolvedValue([
      Object.assign(new AiMessageOrmEntity(), {
        id: 'message-1',
        conversationId: 'conversation-1',
        role: AiMessageRole.USER,
        content: 'Hello',
        metadata: null,
        createdAt,
      }),
    ]);
    const take = jest.fn().mockReturnValue({ getMany });
    const addOrderBy = jest.fn().mockReturnValue({ take });
    const orderBy = jest.fn().mockReturnValue({ addOrderBy });
    const where = jest.fn().mockReturnValue({ orderBy });
    const createQueryBuilder = jest.fn().mockReturnValue({ where });
    const repository = new TypeOrmAiMessageRepository(
      dataSourceWithRepository<AiMessageOrmEntity>({ createQueryBuilder }),
    );

    const result = await repository.findByConversationId('conversation-1');

    expect(orderBy).toHaveBeenCalledWith('message.created_at', 'ASC');
    expect(addOrderBy).toHaveBeenCalledWith('message.id', 'ASC');
    expect(result[0].getContent()).toBe('Hello');
  });

  it('orders tool calls deterministically by generation', async () => {
    const find = jest.fn().mockResolvedValue([
      Object.assign(new AiToolCallOrmEntity(), {
        id: 'tool-call-1',
        generationId: 'generation-1',
        toolName: 'content.get_page',
        status: AiToolCallStatus.PENDING,
        arguments: null,
        resultMetadata: null,
        durationMs: null,
        errorCode: null,
        errorMessage: null,
        createdAt,
        updatedAt: createdAt,
      }),
    ]);
    const repository = new TypeOrmAiToolCallRepository(
      dataSourceWithRepository<AiToolCallOrmEntity>({ find }),
    );

    await repository.findByGenerationId('generation-1');

    expect(find).toHaveBeenCalledWith({
      where: { generationId: 'generation-1' },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  });

  it('sums usage only inside the requested user scope', async () => {
    const getRawOne = jest.fn().mockResolvedValue({
      promptTokens: '2',
      completionTokens: '3',
      totalTokens: '5',
      estimatedCost: '0.01000000',
    });
    const andWhere = jest.fn().mockReturnThis();
    const where = jest.fn().mockReturnValue({ andWhere, getRawOne });
    const addSelect = jest.fn().mockReturnThis();
    const builder = {
      select: jest.fn().mockReturnThis(),
      addSelect,
      where,
    } as unknown as SelectQueryBuilder<AiUsageOrmEntity>;
    const createQueryBuilder = jest.fn().mockReturnValue(builder);
    const repository = new TypeOrmAiUsageRepository(
      dataSourceWithRepository<AiUsageOrmEntity>({ createQueryBuilder }),
    );

    const result = await repository.sumByUser('user-1');

    expect(where).toHaveBeenCalledWith('usage.user_id = :userId', {
      userId: 'user-1',
    });
    expect(result).toEqual({
      promptTokens: 2,
      completionTokens: 3,
      totalTokens: 5,
      estimatedCost: '0.01000000',
    });
  });
});
