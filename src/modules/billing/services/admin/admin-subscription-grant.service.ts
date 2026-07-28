import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role, RoleName } from 'src/modules/role/domain/entities/role.entity';
import { UserRole } from 'src/modules/user_roles/domain/entities/user_role.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import {
  PlanTypeWorkspace,
  Workspace,
} from 'src/modules/workspaces/domain/entities/workspace.entity';
import { DataSource, EntityManager } from 'typeorm';

import {
  DEFAULT_PLAN_LIMITS,
  FREE_PLAN_SLUG,
  RESOURCE_LIMIT_KEY_MAP,
} from '../../constants/default-plan-limits.constant';
import { CancelAdminSubscriptionDto } from '../../dto/request/cancel-admin-subscription.dto';
import { GrantAdminSubscriptionDto } from '../../dto/request/grant-admin-subscription.dto';
import { RevokeAdminSubscriptionDto } from '../../dto/request/revoke-admin-subscription.dto';
import { ResumeAdminSubscriptionDto } from '../../dto/request/resume-admin-subscription.dto';
import { Plan, PlanBillingInterval } from '../../domain/entities/plan.entity';
import { SubscriptionWorkspace } from '../../domain/entities/subscription-workspace.entity';
import {
  BillingProvider,
  Subscription,
  SubscriptionStatus,
} from '../../domain/entities/subscription.entity';
import {
  UsageLimit,
  UsageResourceType,
} from '../../domain/entities/usage-limit.entity';
import {
  getNullableNumberLimit,
  mergePlanLimits,
} from '../../utils/plan-limit.util';

export type AdminGrantSubscriptionResult = {
  userId: string;
  subscriptionId: string;
  planId: string;
  affectedWorkspaceIds: string[];
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
};

export type AdminRevokeSubscriptionResult = {
  userId: string;
  revoked: true;
  subscriptionId: string | null;
  affectedWorkspaceIds: string[];
};

export type AdminCancelSubscriptionResult = {
  subscriptionId: string;
  cancelled: true;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  cancelledAt: Date | null;
  currentPeriodEnd: Date | null;
  affectedWorkspaceIds: string[];
};

export type AdminResumeSubscriptionResult = {
  subscriptionId: string;
  resumed: true;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  cancelledAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  affectedWorkspaceIds: string[];
};

export type ExpireSubscriptionsResult = {
  expiredSubscriptionIds: string[];
  affectedWorkspaceIds: string[];
};

@Injectable()
export class AdminSubscriptionGrantService {
  private readonly logger = new Logger(AdminSubscriptionGrantService.name);

  constructor(private readonly dataSource: DataSource) {}

  expireDueSubscriptions(now = new Date()): Promise<ExpireSubscriptionsResult> {
    return this.dataSource.transaction(async (manager) => {
      const subscriptions = await manager
        .createQueryBuilder(Subscription, 'subscription')
        .setLock('pessimistic_write')
        .where('subscription.status IN (:...statuses)', {
          statuses: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.CANCELLED,
          ],
        })
        .andWhere('subscription.current_period_end IS NOT NULL')
        .andWhere('subscription.current_period_end <= :now', { now })
        .getMany();

      const affectedWorkspaceIds = new Set<string>();

      for (const subscription of subscriptions) {
        const workspaceIds = await this.downgradeSubscriptionWorkspaces({
          manager,
          subscriptionId: subscription.id,
          source: 'subscription_expired',
        });

        workspaceIds.forEach((workspaceId) =>
          affectedWorkspaceIds.add(workspaceId),
        );

        subscription.status = SubscriptionStatus.EXPIRED;
        subscription.cancelAtPeriodEnd = false;
        subscription.metadata = {
          ...(subscription.metadata ?? {}),
          expiration: {
            source: 'subscription_expired',
            expiredAt: now.toISOString(),
            affectedWorkspaceIds: workspaceIds,
          },
        };
        await manager.save(subscription);
      }

      return {
        expiredSubscriptionIds: subscriptions.map(({ id }) => id),
        affectedWorkspaceIds: [...affectedWorkspaceIds],
      };
    });
  }

  grant(dto: GrantAdminSubscriptionDto): Promise<AdminGrantSubscriptionResult> {
    return this.dataSource.transaction(async (manager) => {
      await this.findUserOrFail(manager, dto.userId);
      const workspaces = await this.findOwnedWorkspaces(manager, dto.userId);
      const plan = await this.findActivePlanOrFail(manager, dto.planId);
      const now = new Date();
      const affectedWorkspaceIds = workspaces.map((workspace) => workspace.id);

      const subscription = await this.createOrUpdateManualSubscription({
        manager,
        ownerId: dto.userId,
        plan,
        workspaceIds: affectedWorkspaceIds,
        months: dto.months ?? 1,
        note: dto.note,
        now,
      });

      for (const workspace of workspaces) {
        await this.upsertSubscriptionWorkspace({
          manager,
          workspaceId: workspace.id,
          subscriptionId: subscription.id,
          now,
        });

        await this.applyUsageLimit({
          manager,
          workspaceId: workspace.id,
          plan,
          source: 'admin_grant',
          note: dto.note,
        });

        workspace.planType =
          plan.slug === FREE_PLAN_SLUG
            ? PlanTypeWorkspace.FREE
            : PlanTypeWorkspace.PRO;
        await manager.save(workspace);
      }

      return {
        userId: dto.userId,
        subscriptionId: subscription.id,
        planId: plan.id,
        affectedWorkspaceIds,
        currentPeriodStart: subscription.currentPeriodStart ?? now,
        currentPeriodEnd: subscription.currentPeriodEnd,
      };
    });
  }

  cancel(
    subscriptionId: string,
    dto: CancelAdminSubscriptionDto,
  ): Promise<AdminCancelSubscriptionResult> {
    return this.dataSource.transaction(async (manager) => {
      const subscription = await manager.findOne(Subscription, {
        where: {
          id: subscriptionId,
        },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      const now = new Date();
      const cancelImmediately =
        dto.immediate === true || !subscription.currentPeriodEnd;
      const affectedWorkspaceIds = cancelImmediately
        ? await this.downgradeSubscriptionWorkspaces({
            manager,
            subscriptionId: subscription.id,
            note: dto.note,
          })
        : [];

      subscription.cancelAtPeriodEnd = !cancelImmediately;

      if (cancelImmediately) {
        subscription.status = SubscriptionStatus.CANCELLED;
        subscription.cancelledAt = now;
        subscription.currentPeriodEnd = now;
      }

      subscription.metadata = {
        ...(subscription.metadata ?? {}),
        adminCancellation: {
          source: 'admin_cancel',
          note: dto.note,
          immediate: cancelImmediately,
          requestedAt: now.toISOString(),
          affectedWorkspaceIds,
        },
      };

      const saved = await manager.save(subscription);

      return {
        subscriptionId: saved.id,
        cancelled: true,
        status: saved.status,
        cancelAtPeriodEnd: saved.cancelAtPeriodEnd,
        cancelledAt: saved.cancelledAt,
        currentPeriodEnd: saved.currentPeriodEnd,
        affectedWorkspaceIds,
      };
    });
  }

  resume(
    subscriptionId: string,
    dto: ResumeAdminSubscriptionDto,
  ): Promise<AdminResumeSubscriptionResult> {
    return this.dataSource.transaction(async (manager) => {
      const subscription = await manager.findOne(Subscription, {
        where: {
          id: subscriptionId,
        },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      if (
        subscription.status !== SubscriptionStatus.CANCELLED &&
        !subscription.cancelAtPeriodEnd
      ) {
        throw new BadRequestException('Subscription is not cancelled');
      }

      const now = new Date();
      const affectedWorkspaceIds =
        subscription.status === SubscriptionStatus.CANCELLED
          ? await this.reactivateSubscriptionWorkspaces({
              manager,
              subscription,
              note: dto.note,
              now,
            })
          : [];

      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.cancelAtPeriodEnd = false;
      subscription.cancelledAt = null;
      subscription.currentPeriodStart = subscription.currentPeriodStart ?? now;
      subscription.metadata = {
        ...(subscription.metadata ?? {}),
        adminResume: {
          source: 'admin_resume',
          note: dto.note,
          resumedAt: now.toISOString(),
          affectedWorkspaceIds,
        },
      };

      const saved = await manager.save(subscription);

      return {
        subscriptionId: saved.id,
        resumed: true,
        status: saved.status,
        cancelAtPeriodEnd: saved.cancelAtPeriodEnd,
        cancelledAt: saved.cancelledAt,
        currentPeriodStart: saved.currentPeriodStart,
        currentPeriodEnd: saved.currentPeriodEnd,
        affectedWorkspaceIds,
      };
    });
  }

  revoke(
    dto: RevokeAdminSubscriptionDto,
  ): Promise<AdminRevokeSubscriptionResult> {
    return this.dataSource.transaction(async (manager) => {
      await this.findUserOrFail(manager, dto.userId);
      const workspaces = await this.findOwnedWorkspaces(manager, dto.userId);
      const affectedWorkspaceIds = workspaces.map((workspace) => workspace.id);
      const subscription = await manager.findOne(Subscription, {
        where: {
          userId: dto.userId,
          status: SubscriptionStatus.ACTIVE,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      for (const workspace of workspaces) {
        const subscriptionWorkspace = await manager.findOne(
          SubscriptionWorkspace,
          {
            where: {
              workspaceId: workspace.id,
            },
          },
        );

        if (subscriptionWorkspace) {
          await manager.remove(subscriptionWorkspace);
        }

        await this.applyFreeUsageLimit({
          manager,
          workspaceId: workspace.id,
          note: dto.note,
        });

        workspace.planType = PlanTypeWorkspace.FREE;
        await manager.save(workspace);
      }

      if (subscription) {
        const now = new Date();
        subscription.status = SubscriptionStatus.CANCELLED;
        subscription.cancelAtPeriodEnd = false;
        subscription.cancelledAt = now;
        subscription.currentPeriodEnd = now;
        subscription.metadata = {
          ...(subscription.metadata ?? {}),
          adminRevoke: {
            source: 'admin_revoke',
            note: dto.note,
            revokedAt: now.toISOString(),
            affectedWorkspaceIds,
          },
        };
        await manager.save(subscription);
      }

      return {
        userId: dto.userId,
        revoked: true,
        subscriptionId: subscription?.id ?? null,
        affectedWorkspaceIds,
      };
    });
  }

  private async downgradeSubscriptionWorkspaces(input: {
    manager: EntityManager;
    subscriptionId: string;
    note?: string;
    source?: string;
  }): Promise<string[]> {
    const subscriptionWorkspaces = await input.manager.find(
      SubscriptionWorkspace,
      {
        where: {
          subscriptionId: input.subscriptionId,
        },
      },
    );

    const workspaceIds = subscriptionWorkspaces.map((item) => item.workspaceId);
    const affectedWorkspaceIds: string[] = [];

    if (subscriptionWorkspaces.length > 0) {
      await input.manager.remove(subscriptionWorkspaces);
    }

    for (const workspaceId of workspaceIds) {
      const workspace = await input.manager.findOne(Workspace, {
        where: {
          id: workspaceId,
        },
      });

      if (!workspace) {
        this.logger.warn(
          `Skipping missing workspace ${workspaceId} while downgrading subscription ${input.subscriptionId}`,
        );
        continue;
      }

      workspace.planType = PlanTypeWorkspace.FREE;
      await input.manager.save(workspace);
      affectedWorkspaceIds.push(workspaceId);

      await this.applyFreeUsageLimit({
        manager: input.manager,
        workspaceId,
        note: input.note,
        source: input.source,
      });
    }

    return affectedWorkspaceIds;
  }

  private async reactivateSubscriptionWorkspaces(input: {
    manager: EntityManager;
    subscription: Subscription;
    note?: string;
    now: Date;
  }): Promise<string[]> {
    const plan = await input.manager.findOne(Plan, {
      where: {
        id: input.subscription.planId,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const workspaceIds = this.getRememberedWorkspaceIds(input.subscription);

    for (const workspaceId of workspaceIds) {
      const workspace = await this.findWorkspaceOrFail(
        input.manager,
        workspaceId,
      );

      await this.upsertSubscriptionWorkspace({
        manager: input.manager,
        workspaceId,
        subscriptionId: input.subscription.id,
        now: input.now,
      });

      await this.applyUsageLimit({
        manager: input.manager,
        workspaceId,
        plan,
        source: 'admin_resume',
        note: input.note,
      });

      workspace.planType =
        plan.slug === FREE_PLAN_SLUG
          ? PlanTypeWorkspace.FREE
          : PlanTypeWorkspace.PRO;
      await input.manager.save(workspace);
    }

    return workspaceIds;
  }

  private getRememberedWorkspaceIds(subscription: Subscription): string[] {
    const metadata = subscription.metadata ?? {};
    const workspaceIds = new Set<string>();
    const workspaceId = metadata.workspaceId;
    const rememberedWorkspaceIds = metadata.workspaceIds;

    if (typeof workspaceId === 'string') {
      workspaceIds.add(workspaceId);
    }

    if (Array.isArray(rememberedWorkspaceIds)) {
      rememberedWorkspaceIds.forEach((item) => {
        if (typeof item === 'string') {
          workspaceIds.add(item);
        }
      });
    }

    const adminCancellation = metadata.adminCancellation;

    if (
      adminCancellation &&
      typeof adminCancellation === 'object' &&
      'affectedWorkspaceIds' in adminCancellation
    ) {
      const affectedWorkspaceIds = (
        adminCancellation as Record<string, unknown>
      ).affectedWorkspaceIds;

      if (Array.isArray(affectedWorkspaceIds)) {
        affectedWorkspaceIds.forEach((item) => {
          if (typeof item === 'string') {
            workspaceIds.add(item);
          }
        });
      }
    }

    return [...workspaceIds];
  }

  private async findWorkspaceOrFail(
    manager: EntityManager,
    workspaceId: string,
  ): Promise<Workspace> {
    const workspace = await manager.findOne(Workspace, {
      where: {
        id: workspaceId,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  private async findUserOrFail(
    manager: EntityManager,
    userId: string,
  ): Promise<User> {
    const user = await manager.findOne(User, {
      where: {
        id: userId,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private findOwnedWorkspaces(
    manager: EntityManager,
    userId: string,
  ): Promise<Workspace[]> {
    return manager
      .createQueryBuilder(Workspace, 'workspace')
      .innerJoin(
        UserRole,
        'userRole',
        'userRole.workspace_id = workspace.id AND userRole.user_id = :userId',
        { userId },
      )
      .innerJoin(
        Role,
        'role',
        'role.id = userRole.role_id AND role.workspace_id = workspace.id',
      )
      .where('role.name = :roleName', { roleName: RoleName.OWNER })
      .andWhere('workspace.deleted_at IS NULL')
      .getMany();
  }

  private async findActivePlanOrFail(
    manager: EntityManager,
    planId: string,
  ): Promise<Plan> {
    const plan = await manager.findOne(Plan, {
      where: {
        id: planId,
        isActive: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  private async createOrUpdateManualSubscription(input: {
    manager: EntityManager;
    ownerId: string;
    plan: Plan;
    workspaceIds: string[];
    months: number;
    note?: string;
    now: Date;
  }): Promise<Subscription> {
    const currentSubscription = await input.manager.findOne(Subscription, {
      where: {
        userId: input.ownerId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const periodEnd =
      input.plan.billingInterval === PlanBillingInterval.LIFETIME
        ? null
        : this.addMonths(input.now, input.months);

    const metadata = {
      ...(currentSubscription?.metadata ?? {}),
      source: 'admin_grant',
      workspaceIds: input.workspaceIds,
      note: input.note,
      grantedAt: input.now.toISOString(),
    };

    if (!currentSubscription) {
      const subscription = input.manager.create(Subscription, {
        userId: input.ownerId,
        planId: input.plan.id,
        provider: BillingProvider.MANUAL,
        providerSubscriptionId: null,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: input.now,
        currentPeriodEnd: periodEnd,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        metadata,
      });

      return input.manager.save(subscription);
    }

    currentSubscription.planId = input.plan.id;
    currentSubscription.provider = BillingProvider.MANUAL;
    currentSubscription.providerSubscriptionId = null;
    currentSubscription.status = SubscriptionStatus.ACTIVE;
    currentSubscription.currentPeriodStart = input.now;
    currentSubscription.currentPeriodEnd = periodEnd;
    currentSubscription.cancelAtPeriodEnd = false;
    currentSubscription.cancelledAt = null;
    currentSubscription.metadata = metadata;

    return input.manager.save(currentSubscription);
  }

  private async upsertSubscriptionWorkspace(input: {
    manager: EntityManager;
    workspaceId: string;
    subscriptionId: string;
    now: Date;
  }): Promise<void> {
    const existed = await input.manager.findOne(SubscriptionWorkspace, {
      where: {
        workspaceId: input.workspaceId,
      },
    });

    if (existed) {
      existed.subscriptionId = input.subscriptionId;
      existed.activatedAt = input.now;

      await input.manager.save(existed);
      return;
    }

    const subscriptionWorkspace = input.manager.create(SubscriptionWorkspace, {
      subscriptionId: input.subscriptionId,
      workspaceId: input.workspaceId,
      activatedAt: input.now,
    });

    await input.manager.save(subscriptionWorkspace);
  }

  private async applyFreeUsageLimit(input: {
    manager: EntityManager;
    workspaceId: string;
    note?: string;
    source?: string;
  }): Promise<void> {
    const freePlan = await input.manager.findOne(Plan, {
      where: {
        slug: FREE_PLAN_SLUG,
      },
    });

    if (freePlan) {
      await this.applyUsageLimit({
        manager: input.manager,
        workspaceId: input.workspaceId,
        plan: freePlan,
        source: input.source ?? 'admin_revoke',
        note: input.note,
      });
      return;
    }

    await this.applyUsageLimitByLimits({
      manager: input.manager,
      workspaceId: input.workspaceId,
      planId: null,
      planSlug: FREE_PLAN_SLUG,
      limits: DEFAULT_PLAN_LIMITS[FREE_PLAN_SLUG],
      source: input.source ?? 'admin_revoke',
      note: input.note,
    });
  }

  private async applyUsageLimit(input: {
    manager: EntityManager;
    workspaceId: string;
    plan: Plan;
    source: string;
    note?: string;
  }): Promise<void> {
    await this.applyUsageLimitByLimits({
      manager: input.manager,
      workspaceId: input.workspaceId,
      planId: input.plan.id,
      planSlug: input.plan.slug,
      limits: mergePlanLimits(input.plan),
      source: input.source,
      note: input.note,
    });
  }

  private async applyUsageLimitByLimits(input: {
    manager: EntityManager;
    workspaceId: string;
    planId: string | null;
    planSlug: string;
    limits: Record<string, unknown>;
    source: string;
    note?: string;
  }): Promise<void> {
    for (const resourceType of Object.values(UsageResourceType)) {
      const limitKey = RESOURCE_LIMIT_KEY_MAP[resourceType];
      const limitValue = getNullableNumberLimit(input.limits, limitKey);

      if (limitValue === undefined) {
        continue;
      }

      const existed = await input.manager.findOne(UsageLimit, {
        where: {
          workspaceId: input.workspaceId,
          resourceType,
        },
      });

      if (existed) {
        existed.planId = input.planId;
        existed.limitValue = limitValue;
        existed.metadata = {
          source: input.source,
          planSlug: input.planSlug,
          note: input.note,
        };

        await input.manager.save(existed);
        continue;
      }

      const usageLimit = input.manager.create(UsageLimit, {
        workspaceId: input.workspaceId,
        planId: input.planId,
        resourceType,
        limitValue,
        usedValue: 0,
        resetAt: null,
        metadata: {
          source: input.source,
          planSlug: input.planSlug,
          note: input.note,
        },
      });

      await input.manager.save(usageLimit);
    }
  }

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);

    return result;
  }
}
