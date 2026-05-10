import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { Repository } from 'typeorm';
import {
  RetentionMetricLevel,
  RetentionMetricResponseDto,
} from '../../dto/response/dashboard/retention-metrics.response.dto';
import { AdminRetentionMetricsRepository } from '../../interfaces/repositories/dashboard/admin-retention-metrics.repository.interface';

type CountRaw = {
  count: string;
};

@Injectable()
export class AdminRetentionMetricsRepositoryImpl implements AdminRetentionMetricsRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}

  async getRetentionMetrics(): Promise<RetentionMetricResponseDto[]> {
    const now = new Date();

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const eligibleUsers = await this.countEligibleUsers(thirtyDaysAgo);
    const retainedUsers = await this.countRetainedUsers(thirtyDaysAgo);

    const retentionRate =
      eligibleUsers === 0 ? 0 : (retainedUsers / eligibleUsers) * 100;

    const activeProWorkspaces = await this.countActiveProWorkspaces();
    const deletedProWorkspacesThisMonth =
      await this.countDeletedProWorkspacesThisMonth(startOfMonth, now);

    const churnBase = activeProWorkspaces + deletedProWorkspacesThisMonth;

    const churnRate =
      churnBase === 0 ? 0 : (deletedProWorkspacesThisMonth / churnBase) * 100;

    return [
      {
        key: 'retention-30d',
        label: '30-day Retention',
        value: Number(retentionRate.toFixed(1)),
        suffix: '%',
        description: 'Users created before 30 days and active again recently.',
        level: this.getRetentionLevel(retentionRate),
      },
      {
        key: 'monthly-churn',
        label: 'Monthly Churn',
        value: Number(churnRate.toFixed(1)),
        suffix: '%',
        description: 'Pro workspaces lost this month.',
        level: this.getChurnLevel(churnRate),
      },
    ];
  }

  private async countEligibleUsers(thirtyDaysAgo: Date): Promise<number> {
    const raw = await this.userRepository
      .createQueryBuilder('u')
      .select('COUNT("u"."id")', 'count')
      .where('"u"."created_at" <= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('"u"."deleted_at" IS NULL')
      .getRawOne<CountRaw>();

    return Number(raw?.count ?? 0);
  }

  private async countRetainedUsers(thirtyDaysAgo: Date): Promise<number> {
    const raw = await this.userRepository
      .createQueryBuilder('u')
      .select('COUNT("u"."id")', 'count')
      .where('"u"."created_at" <= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('"u"."updated_at" >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('"u"."deleted_at" IS NULL')
      .getRawOne<CountRaw>();

    return Number(raw?.count ?? 0);
  }

  private async countActiveProWorkspaces(): Promise<number> {
    const raw = await this.workspaceRepository
      .createQueryBuilder('w')
      .select('COUNT("w"."id")', 'count')
      .where('"w"."plan_type" = :plan', { plan: 'pro' })
      .andWhere('"w"."deleted_at" IS NULL')
      .getRawOne<CountRaw>();

    return Number(raw?.count ?? 0);
  }

  private async countDeletedProWorkspacesThisMonth(
    startOfMonth: Date,
    now: Date,
  ): Promise<number> {
    const raw = await this.workspaceRepository
      .createQueryBuilder('w')
      .withDeleted()
      .select('COUNT("w"."id")', 'count')
      .where('"w"."plan_type" = :plan', { plan: 'pro' })
      .andWhere('"w"."deleted_at" >= :startOfMonth', { startOfMonth })
      .andWhere('"w"."deleted_at" <= :now', { now })
      .getRawOne<CountRaw>();

    return Number(raw?.count ?? 0);
  }

  private getRetentionLevel(rate: number): RetentionMetricLevel {
    if (rate >= 70) return 'success';
    if (rate >= 40) return 'warning';
    return 'danger';
  }

  private getChurnLevel(rate: number): RetentionMetricLevel {
    if (rate <= 5) return 'success';
    if (rate <= 15) return 'warning';
    return 'danger';
  }
}
