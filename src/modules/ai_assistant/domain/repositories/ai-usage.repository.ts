import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { AiUsage } from '../entities/ai-usage.entity';

export interface AiUsageSummary {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: string;
}

export interface AiUsageSummaryOptions {
  workspaceId?: string;
  from?: Date;
  to?: Date;
}

export interface AiUsageRepository {
  save(usage: AiUsage, context?: PersistenceContext): Promise<AiUsage>;

  sumByUser(
    userId: string,
    options?: AiUsageSummaryOptions,
    context?: PersistenceContext,
  ): Promise<AiUsageSummary>;

  sumByWorkspace(
    workspaceId: string,
    options?: Omit<AiUsageSummaryOptions, 'workspaceId'>,
    context?: PersistenceContext,
  ): Promise<AiUsageSummary>;
}
