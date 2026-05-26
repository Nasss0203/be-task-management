import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { Repository } from 'typeorm';

import { Plan } from '../../domain/entities/plan.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../../domain/entities/subscription.entity';
import { SubscriptionWorkspace } from '../../domain/entities/subscription-workspace.entity';
import { UsageLimit } from '../../domain/entities/usage-limit.entity';

const FREE_PLAN_LIMITS = {
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
};

@Injectable()
export class BillingQueryService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(SubscriptionWorkspace)
    private readonly subscriptionWorkspaceRepository: Repository<SubscriptionWorkspace>,

    @InjectRepository(UsageLimit)
    private readonly usageLimitRepository: Repository<UsageLimit>,

    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepository: Repository<UserWorkspace>,
  ) {}

  async getCurrentSubscription(userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!subscription) {
      return {
        plan: {
          name: 'FREE',
          slug: 'free',
          limits: FREE_PLAN_LIMITS,
        },
        subscription: null,
        upgradedWorkspace: {
          used: 0,
          limit: 0,
        },
      };
    }

    const plan = await this.planRepository.findOne({
      where: {
        id: subscription.planId,
      },
    });

    const upgradedWorkspaceUsed =
      await this.subscriptionWorkspaceRepository.count({
        where: {
          subscriptionId: subscription.id,
        },
      });

    const limits = plan?.limits ?? {};
    const upgradedWorkspaceLimit = this.getNumberLimit(
      limits,
      'upgradedWorkspaces',
      plan?.slug === 'pro-monthly' ? 15 : 0,
    );

    return {
      plan: plan
        ? {
            id: plan.id,
            name: plan.name,
            slug: plan.slug,
            priceAmount: plan.priceAmount,
            currency: plan.currency,
            billingInterval: plan.billingInterval,
            features: plan.features,
            limits: plan.limits,
          }
        : null,

      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt,
      },

      upgradedWorkspace: {
        used: upgradedWorkspaceUsed,
        limit: upgradedWorkspaceLimit,
      },
    };
  }

  async getWorkspaceUsageLimits(userId: string, workspaceId: string) {
    const member = await this.userWorkspaceRepository.findOne({
      where: {
        user_id: userId,
        workspace_id: workspaceId,
      },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const usageLimits = await this.usageLimitRepository.find({
      where: {
        workspaceId,
      },
      order: {
        resourceType: 'ASC',
      },
    });

    return usageLimits.map((item) => ({
      id: item.id,
      workspaceId: item.workspaceId,
      planId: item.planId,
      resourceType: item.resourceType,
      limitValue: item.limitValue,
      usedValue: item.usedValue,
      remaining:
        item.limitValue === null
          ? null
          : Math.max(item.limitValue - item.usedValue, 0),
      resetAt: item.resetAt,
      metadata: item.metadata,
    }));
  }

  private getNumberLimit(
    limits: Record<string, unknown> | null,
    key: string,
    defaultValue: number,
  ): number {
    const value = limits?.[key];

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
}
