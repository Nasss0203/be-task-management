import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import type { AiUsage } from 'src/modules/ai_assistant/domain/entities/ai-usage.entity';
import type {
  AiUsageRepository,
  AiUsageSummary,
  AiUsageSummaryOptions,
} from 'src/modules/ai_assistant/domain/repositories/ai-usage.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { AiUsageOrmEntity } from '../entities/ai-usage.orm-entity';
import { AiUsageMapper } from '../mappers/ai-usage.mapper';

type AiUsageSummaryRaw = {
  promptTokens: string | null;
  completionTokens: string | null;
  totalTokens: string | null;
  estimatedCost: string | null;
};

@Injectable()
export class TypeOrmAiUsageRepository implements AiUsageRepository {
  constructor(private readonly dataSource: DataSource) {}

  async save(usage: AiUsage, context?: PersistenceContext): Promise<AiUsage> {
    const saved = await this.getRepo(context).save(AiUsageMapper.toOrm(usage));
    return AiUsageMapper.toDomain(saved);
  }

  async sumByUser(
    userId: string,
    options: AiUsageSummaryOptions = {},
    context?: PersistenceContext,
  ): Promise<AiUsageSummary> {
    const query = this.summaryQuery(context).where('usage.user_id = :userId', {
      userId,
    });

    if (options.workspaceId) {
      query.andWhere('usage.workspace_id = :workspaceId', {
        workspaceId: options.workspaceId,
      });
    }

    return this.executeSummary(this.applyTimeRange(query, options));
  }

  async sumByWorkspace(
    workspaceId: string,
    options: Omit<AiUsageSummaryOptions, 'workspaceId'> = {},
    context?: PersistenceContext,
  ): Promise<AiUsageSummary> {
    const query = this.summaryQuery(context).where(
      'usage.workspace_id = :workspaceId',
      { workspaceId },
    );

    return this.executeSummary(this.applyTimeRange(query, options));
  }

  private summaryQuery(
    context?: PersistenceContext,
  ): SelectQueryBuilder<AiUsageOrmEntity> {
    return this.getRepo(context)
      .createQueryBuilder('usage')
      .select('COALESCE(SUM(usage.prompt_tokens), 0)', 'promptTokens')
      .addSelect(
        'COALESCE(SUM(usage.completion_tokens), 0)',
        'completionTokens',
      )
      .addSelect('COALESCE(SUM(usage.total_tokens), 0)', 'totalTokens')
      .addSelect('COALESCE(SUM(usage.estimated_cost), 0)', 'estimatedCost');
  }

  private applyTimeRange(
    query: SelectQueryBuilder<AiUsageOrmEntity>,
    options: Pick<AiUsageSummaryOptions, 'from' | 'to'>,
  ): SelectQueryBuilder<AiUsageOrmEntity> {
    if (options.from) {
      query.andWhere('usage.created_at >= :from', { from: options.from });
    }

    if (options.to) {
      query.andWhere('usage.created_at <= :to', { to: options.to });
    }

    return query;
  }

  private async executeSummary(
    query: SelectQueryBuilder<AiUsageOrmEntity>,
  ): Promise<AiUsageSummary> {
    const raw = await query.getRawOne<AiUsageSummaryRaw>();

    return {
      promptTokens: Number(raw?.promptTokens ?? 0),
      completionTokens: Number(raw?.completionTokens ?? 0),
      totalTokens: Number(raw?.totalTokens ?? 0),
      estimatedCost: raw?.estimatedCost ?? '0',
    };
  }

  private getRepo(context?: PersistenceContext): Repository<AiUsageOrmEntity> {
    const manager = context as EntityManager | undefined;
    return manager
      ? manager.getRepository(AiUsageOrmEntity)
      : this.dataSource.getRepository(AiUsageOrmEntity);
  }
}
