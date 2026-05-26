import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { EntityManager, Repository } from 'typeorm';

import { Plan } from '../domain/entities/plan.entity';
import { SubscriptionWorkspace } from '../domain/entities/subscription-workspace.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../domain/entities/subscription.entity';
import {
  UsageLimit,
  UsageResourceType,
} from '../domain/entities/usage-limit.entity';

const FREE_PLAN_SLUG = 'free';
const PRO_PLAN_SLUG = 'pro-monthly';

const DEFAULT_PLAN_LIMITS: Record<string, Record<string, number | null>> = {
  [FREE_PLAN_SLUG]: {
    workspaces: 5,
    upgradedWorkspaces: 0,

    members: 3,
    projects: 3,
    tasks: 100,
    pages: 20,
    pageTemplates: 5,
    storageMb: 100,
    attachments: 20,
    sprints: 3,
  },

  [PRO_PLAN_SLUG]: {
    workspaces: 15,
    upgradedWorkspaces: 15,

    members: 10,
    projects: 20,
    tasks: 1000,
    pages: 100,
    pageTemplates: 20,
    storageMb: 1024,
    attachments: 200,
    sprints: 20,
  },
};

const RESOURCE_LIMIT_KEY_MAP: Record<UsageResourceType, string> = {
  [UsageResourceType.MEMBERS]: 'members',
  [UsageResourceType.PROJECTS]: 'projects',
  [UsageResourceType.TASKS]: 'tasks',
  [UsageResourceType.PAGES]: 'pages',
  [UsageResourceType.PAGE_TEMPLATES]: 'pageTemplates',
  [UsageResourceType.STORAGE_MB]: 'storageMb',
  [UsageResourceType.ATTACHMENTS]: 'attachments',
  [UsageResourceType.SPRINTS]: 'sprints',
};

@Injectable()
export class CheckWorkspaceLimitService {
  constructor(
    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepository: Repository<UserWorkspace>,

    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(SubscriptionWorkspace)
    private readonly subscriptionWorkspaceRepository: Repository<SubscriptionWorkspace>,

    @InjectRepository(UsageLimit)
    private readonly usageLimitRepository: Repository<UsageLimit>,
  ) {}

  async checkCanCreateWorkspace(
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const currentWorkspaceCount = await this.countActiveWorkspacesByUserId(
      userId,
      manager,
    );

    const activeSubscription = await this.findActiveSubscription(
      userId,
      manager,
    );

    if (!activeSubscription) {
      const freeLimit = this.getNumberLimit(
        DEFAULT_PLAN_LIMITS[FREE_PLAN_SLUG],
        'workspaces',
        5,
      );

      if (currentWorkspaceCount >= freeLimit) {
        throw new BadRequestException(
          `Free plan can create up to ${freeLimit} workspaces`,
        );
      }

      return;
    }

    const plan = await this.findPlanById(activeSubscription.planId, manager);

    const limits = this.mergePlanLimits(plan);
    const workspaceLimit = this.getNumberLimit(limits, 'workspaces', 5);

    if (currentWorkspaceCount >= workspaceLimit) {
      throw new BadRequestException(
        `Your plan can create up to ${workspaceLimit} workspaces`,
      );
    }
  }

  async applyBillingForNewWorkspace(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const activeSubscription = await this.findActiveSubscription(
      userId,
      manager,
    );

    if (!activeSubscription) {
      await this.applyFreeUsageLimit(workspaceId, manager);
      return;
    }

    const plan = await this.findPlanById(activeSubscription.planId, manager);

    if (!plan || plan.slug !== PRO_PLAN_SLUG) {
      await this.applyFreeUsageLimit(workspaceId, manager);
      return;
    }

    const limits = this.mergePlanLimits(plan);

    const upgradedWorkspaceLimit = this.getNumberLimit(
      limits,
      'upgradedWorkspaces',
      0,
    );

    const subscriptionWorkspaceRepository =
      this.getSubscriptionWorkspaceRepository(manager);

    const activeUpgradeCount = await subscriptionWorkspaceRepository.count({
      where: {
        subscriptionId: activeSubscription.id,
      },
    });

    if (activeUpgradeCount >= upgradedWorkspaceLimit) {
      await this.applyFreeUsageLimit(workspaceId, manager);
      return;
    }

    const existedSubscriptionWorkspace =
      await subscriptionWorkspaceRepository.findOne({
        where: {
          workspaceId,
        },
      });

    if (existedSubscriptionWorkspace) {
      existedSubscriptionWorkspace.subscriptionId = activeSubscription.id;
      existedSubscriptionWorkspace.activatedAt = new Date();

      await subscriptionWorkspaceRepository.save(existedSubscriptionWorkspace);
    } else {
      const subscriptionWorkspace = subscriptionWorkspaceRepository.create({
        subscriptionId: activeSubscription.id,
        workspaceId,
        activatedAt: new Date(),
      });

      await subscriptionWorkspaceRepository.save(subscriptionWorkspace);
    }

    await this.applyUsageLimit({
      workspaceId,
      plan,
      manager,
      source: 'workspace_create',
    });
  }

  private async countActiveWorkspacesByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const userWorkspaceRepository = this.getUserWorkspaceRepository(manager);

    return userWorkspaceRepository
      .createQueryBuilder('uw')
      .innerJoin(Workspace, 'w', 'w.id = uw.workspace_id')
      .where('uw.user_id = :userId', { userId })
      .andWhere('w.deleted_at IS NULL')
      .getCount();
  }

  private async applyFreeUsageLimit(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const freePlan = await this.findActivePlanBySlug(FREE_PLAN_SLUG, manager);

    if (freePlan) {
      await this.applyUsageLimit({
        workspaceId,
        plan: freePlan,
        manager,
        source: 'workspace_create',
      });

      return;
    }

    await this.applyUsageLimitByLimits({
      workspaceId,
      planId: null,
      planSlug: FREE_PLAN_SLUG,
      limits: DEFAULT_PLAN_LIMITS[FREE_PLAN_SLUG],
      manager,
      source: 'workspace_create',
    });
  }

  private async applyUsageLimit(input: {
    workspaceId: string;
    plan: Plan;
    manager?: EntityManager;
    source: string;
  }): Promise<void> {
    const limits = this.mergePlanLimits(input.plan);

    await this.applyUsageLimitByLimits({
      workspaceId: input.workspaceId,
      planId: input.plan.id,
      planSlug: input.plan.slug,
      limits,
      manager: input.manager,
      source: input.source,
    });
  }

  private async applyUsageLimitByLimits(input: {
    workspaceId: string;
    planId: string | null;
    planSlug: string;
    limits: Record<string, unknown>;
    manager?: EntityManager;
    source: string;
  }): Promise<void> {
    const usageLimitRepository = this.getUsageLimitRepository(input.manager);

    for (const resourceType of Object.values(UsageResourceType)) {
      const limitKey = RESOURCE_LIMIT_KEY_MAP[resourceType];

      const limitValue = this.getNullableNumberLimit(input.limits, limitKey);

      if (limitValue === undefined) {
        continue;
      }

      const existed = await usageLimitRepository.findOne({
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
        };

        await usageLimitRepository.save(existed);
        continue;
      }

      const usageLimit = usageLimitRepository.create({
        workspaceId: input.workspaceId,
        planId: input.planId,
        resourceType,
        limitValue,
        usedValue: 0,
        resetAt: null,
        metadata: {
          source: input.source,
          planSlug: input.planSlug,
        },
      });

      await usageLimitRepository.save(usageLimit);
    }
  }

  private async findActiveSubscription(
    userId: string,
    manager?: EntityManager,
  ): Promise<Subscription | null> {
    return this.getSubscriptionRepository(manager).findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  private async findPlanById(
    planId: string,
    manager?: EntityManager,
  ): Promise<Plan | null> {
    return this.getPlanRepository(manager).findOne({
      where: {
        id: planId,
        isActive: true,
      },
    });
  }

  private async findActivePlanBySlug(
    slug: string,
    manager?: EntityManager,
  ): Promise<Plan | null> {
    return this.getPlanRepository(manager).findOne({
      where: {
        slug,
        isActive: true,
      },
    });
  }

  private mergePlanLimits(plan: Plan | null): Record<string, unknown> {
    if (!plan) {
      return DEFAULT_PLAN_LIMITS[FREE_PLAN_SLUG];
    }

    const defaultLimits = DEFAULT_PLAN_LIMITS[plan.slug] ?? {};
    const customLimits = plan.limits ?? {};

    return {
      ...defaultLimits,
      ...customLimits,
    };
  }

  private getNumberLimit(
    limits: Record<string, unknown>,
    key: string,
    defaultValue: number,
  ): number {
    const value = limits[key];

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return defaultValue;
  }

  private getNullableNumberLimit(
    limits: Record<string, unknown>,
    key: string,
  ): number | null | undefined {
    const value = limits[key];

    if (value === null) {
      return null;
    }

    if (value === undefined) {
      return undefined;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return undefined;
  }

  private getUserWorkspaceRepository(
    manager?: EntityManager,
  ): Repository<UserWorkspace> {
    return (
      manager?.getRepository(UserWorkspace) ?? this.userWorkspaceRepository
    );
  }

  private getWorkspaceRepository(
    manager?: EntityManager,
  ): Repository<Workspace> {
    return manager?.getRepository(Workspace) ?? this.workspaceRepository;
  }

  private getSubscriptionRepository(
    manager?: EntityManager,
  ): Repository<Subscription> {
    return manager?.getRepository(Subscription) ?? this.subscriptionRepository;
  }

  private getPlanRepository(manager?: EntityManager): Repository<Plan> {
    return manager?.getRepository(Plan) ?? this.planRepository;
  }

  private getSubscriptionWorkspaceRepository(
    manager?: EntityManager,
  ): Repository<SubscriptionWorkspace> {
    return (
      manager?.getRepository(SubscriptionWorkspace) ??
      this.subscriptionWorkspaceRepository
    );
  }

  private getUsageLimitRepository(
    manager?: EntityManager,
  ): Repository<UsageLimit> {
    return manager?.getRepository(UsageLimit) ?? this.usageLimitRepository;
  }
}
