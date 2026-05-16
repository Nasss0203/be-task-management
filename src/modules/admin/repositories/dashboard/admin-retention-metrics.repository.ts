import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserActivity } from 'src/modules/user_activity/domain/entities/user_activity.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import {
  PlanTypeWorkspace,
  Workspace,
} from 'src/modules/workspaces/domain/entities/workspace.entity';
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

    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,

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
        description:
          eligibleUsers === 0
            ? 'Not enough users older than 30 days to calculate retention.'
            : 'Users created before 30 days and active again recently.',
        level:
          eligibleUsers === 0
            ? 'warning'
            : this.getRetentionLevel(retentionRate),
      },
      {
        key: 'monthly-churn',
        label: 'Monthly Churn',
        value: Number(churnRate.toFixed(1)),
        suffix: '%',
        description:
          churnBase === 0
            ? 'No Pro workspaces available to calculate churn.'
            : 'Pro workspaces lost this month.',
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
    const raw = await this.userActivityRepository
      .createQueryBuilder('activity')
      .innerJoin(User, 'u', '"u"."id" = "activity"."user_id"')
      .select('COUNT(DISTINCT "activity"."user_id")', 'count')
      .where('"u"."created_at" <= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('"activity"."created_at" >= :thirtyDaysAgo', {
        thirtyDaysAgo,
      })
      .andWhere('"u"."deleted_at" IS NULL')
      .getRawOne<CountRaw>();

    return Number(raw?.count ?? 0);
  }

  private async countActiveProWorkspaces(): Promise<number> {
    const raw = await this.workspaceRepository
      .createQueryBuilder('w')
      .select('COUNT("w"."id")', 'count')
      .where('"w"."plan_type" = :plan', {
        plan: PlanTypeWorkspace.PRO,
      })
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
      .where('"w"."plan_type" = :plan', {
        plan: PlanTypeWorkspace.PRO,
      })
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
