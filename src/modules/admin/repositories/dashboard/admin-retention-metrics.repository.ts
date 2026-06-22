import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserActivity } from 'src/modules/user_activity/domain/entities/user_activity.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/modules/billing/domain/entities/subscription.entity';
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

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
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

    const lostProWorkspacesThisMonth =
      await this.countLostProWorkspacesThisMonth(startOfMonth, now);

    const churnBase = activeProWorkspaces + lostProWorkspacesThisMonth;

    const churnRate =
      churnBase === 0 ? 0 : (lostProWorkspacesThisMonth / churnBase) * 100;

    return [
      {
        key: 'retention-30d',
        label: 'Giữ chân 30 ngày',
        value: Number(retentionRate.toFixed(1)),
        suffix: '%',
        description:
          eligibleUsers === 0
            ? 'Chưa đủ người dùng đã đăng ký trên 30 ngày để tính tỷ lệ giữ chân.'
            : 'Tỷ lệ người dùng đã đăng ký trên 30 ngày và có hoạt động trở lại trong 30 ngày gần đây.',
        level:
          eligibleUsers === 0
            ? 'warning'
            : this.getRetentionLevel(retentionRate),
      },
      {
        key: 'monthly-churn',
        label: 'Rời bỏ hàng tháng',
        value: Number(churnRate.toFixed(1)),
        suffix: '%',
        description:
          churnBase === 0
            ? 'Chưa có workspace Pro để tính tỷ lệ rời bỏ.'
            : 'Tỷ lệ workspace đã mất gói Pro trong tháng này.',
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

  private async countLostProWorkspacesThisMonth(
    startOfMonth: Date,
    now: Date,
  ): Promise<number> {
    const rows = await this.subscriptionRepository.query<CountRaw[]>(
      `
        SELECT COUNT(DISTINCT lost_workspace.value)::text AS count
        FROM subscriptions subscription
        CROSS JOIN LATERAL jsonb_array_elements_text(
          CASE
            WHEN subscription.status = $1
              AND jsonb_typeof(
                subscription.metadata->'expiration'->'affectedWorkspaceIds'
              ) = 'array'
              THEN subscription.metadata->'expiration'->'affectedWorkspaceIds'
            WHEN subscription.status = $2
              AND jsonb_typeof(
                COALESCE(
                  subscription.metadata->'adminRevoke'->'affectedWorkspaceIds',
                  subscription.metadata->'adminCancellation'->'affectedWorkspaceIds'
                )
              ) = 'array'
              THEN COALESCE(
                subscription.metadata->'adminRevoke'->'affectedWorkspaceIds',
                subscription.metadata->'adminCancellation'->'affectedWorkspaceIds'
              )
            ELSE '[]'::jsonb
          END
        ) AS lost_workspace(value)
        WHERE (
            subscription.status = $1
            AND subscription.current_period_end >= $3
            AND subscription.current_period_end <= $4
          ) OR (
            subscription.status = $2
            AND subscription.cancelled_at >= $3
            AND subscription.cancelled_at <= $4
          )
      `,
      [
        SubscriptionStatus.EXPIRED,
        SubscriptionStatus.CANCELLED,
        startOfMonth,
        now,
      ],
    );

    return Number(rows[0]?.count ?? 0);
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
