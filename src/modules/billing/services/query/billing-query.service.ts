import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DEFAULT_PLAN_LIMITS,
  FREE_PLAN_SLUG,
} from '../../constants/default-plan-limits.constant';
import { type BillingQueryRepository } from '../../interfaces/repositories/query/billing-query.repository.interface';
import { type BillingQueryService } from '../../interfaces/services/query/billing-query.service.interface';
import { BILLING_TYPES } from '../../interfaces/types';
import { PlanMapper } from '../../mapper/plan.mapper';
import { getNumberLimit } from '../../utils/plan-limit.util';

@Injectable()
export class BillingQueryServiceImpl implements BillingQueryService {
  constructor(
    @Inject(BILLING_TYPES.repositories.BillingQueryRepository)
    private readonly billingQueryRepository: BillingQueryRepository,
  ) {}

  async getPlans() {
    const plans = await this.billingQueryRepository.findActivePlans();

    return PlanMapper.toResponseList(
      plans.map((plan) => PlanMapper.toModel(plan)),
    );
  }

  async getPlanById(planId: string) {
    const plan = await this.billingQueryRepository.findActivePlanById(planId);

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return PlanMapper.toResponse(PlanMapper.toModel(plan));
  }

  async getCurrentSubscription(userId: string) {
    const subscription =
      await this.billingQueryRepository.findActiveSubscription(userId);

    if (!subscription) {
      return {
        plan: {
          name: 'FREE',
          slug: FREE_PLAN_SLUG,
          limits: DEFAULT_PLAN_LIMITS[FREE_PLAN_SLUG],
        },
        subscription: null,
        upgradedWorkspace: {
          used: 0,
          limit: 0,
        },
      };
    }

    const plan = await this.billingQueryRepository.findPlanById(
      subscription.planId,
    );

    const upgradedWorkspaceUsed =
      await this.billingQueryRepository.countSubscriptionWorkspaces(
        subscription.id,
      );

    const limits = plan?.limits ?? {};
    const upgradedWorkspaceLimit = getNumberLimit(
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
    const member = await this.billingQueryRepository.existsWorkspaceMember(
      userId,
      workspaceId,
    );

    if (!member) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const usageLimits =
      await this.billingQueryRepository.findUsageLimitsByWorkspaceId(
        workspaceId,
      );

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
}
