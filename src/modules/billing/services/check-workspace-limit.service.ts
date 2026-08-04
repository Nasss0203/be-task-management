import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { EntityManager } from 'typeorm';

import { Plan } from '../domain/entities/plan.entity';
import {
  DEFAULT_PLAN_LIMITS,
  FREE_PLAN_SLUG,
  PRO_PLAN_SLUG,
  RESOURCE_LIMIT_KEY_MAP,
} from '../constants/default-plan-limits.constant';
import { UsageResourceType } from '../domain/entities/usage-limit.entity';
import { type WorkspaceLimitRepository } from '../interfaces/repositories/workspace-limit/workspace-limit.repository.interface';
import { type CheckWorkspaceLimitService } from '../interfaces/services/check-workspace-limit.service.interface';
import { BILLING_TYPES } from '../interfaces/types';
import {
  getNullableNumberLimit,
  getNumberLimit,
  mergePlanLimits,
} from '../utils/plan-limit.util';

@Injectable()
export class CheckWorkspaceLimitServiceImpl implements CheckWorkspaceLimitService {
  constructor(
    @Inject(BILLING_TYPES.repositories.WorkspaceLimitRepository)
    private readonly workspaceLimitRepository: WorkspaceLimitRepository,
  ) {}

  async checkCanCreateWorkspace(
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const currentWorkspaceCount =
      await this.workspaceLimitRepository.countActiveWorkspacesByUserId(
        userId,
        manager,
      );

    const activeSubscription =
      await this.workspaceLimitRepository.findActiveSubscription(
        userId,
        manager,
      );

    if (!activeSubscription) {
      const freeLimit = getNumberLimit(
        DEFAULT_PLAN_LIMITS[FREE_PLAN_SLUG],
        'workspaces',
        5,
      );

      if (currentWorkspaceCount >= freeLimit) {
        throw new BadRequestException({
          code: ErrorCode.WORKSPACE_LIMIT_EXCEEDED,
          message: `Free plan can create up to ${freeLimit} workspaces`,
        });
      }

      return;
    }

    const plan = await this.workspaceLimitRepository.findActivePlanById(
      activeSubscription.planId,
      manager,
    );

    const limits = mergePlanLimits(plan);
    const workspaceLimit = getNumberLimit(limits, 'workspaces', 5);

    if (currentWorkspaceCount >= workspaceLimit) {
      throw new BadRequestException({
        code: ErrorCode.WORKSPACE_LIMIT_EXCEEDED,
        message: `Your plan can create up to ${workspaceLimit} workspaces`,
      });
    }
  }

  async applyBillingForNewWorkspace(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const activeSubscription =
      await this.workspaceLimitRepository.findActiveSubscription(
        userId,
        manager,
      );

    if (!activeSubscription) {
      await this.applyFreeUsageLimit(workspaceId, manager);
      return;
    }

    const plan = await this.workspaceLimitRepository.findActivePlanById(
      activeSubscription.planId,
      manager,
    );

    if (!plan || plan.slug !== PRO_PLAN_SLUG) {
      await this.applyFreeUsageLimit(workspaceId, manager);
      return;
    }

    const limits = mergePlanLimits(plan);

    const upgradedWorkspaceLimit = getNumberLimit(
      limits,
      'upgradedWorkspaces',
      0,
    );

    const activeUpgradeCount =
      await this.workspaceLimitRepository.countSubscriptionWorkspaces(
        activeSubscription.id,
        manager,
      );

    if (activeUpgradeCount >= upgradedWorkspaceLimit) {
      await this.applyFreeUsageLimit(workspaceId, manager);
      return;
    }

    const existedSubscriptionWorkspace =
      await this.workspaceLimitRepository.findSubscriptionWorkspaceByWorkspaceId(
        workspaceId,
        manager,
      );

    if (existedSubscriptionWorkspace) {
      existedSubscriptionWorkspace.subscriptionId = activeSubscription.id;
      existedSubscriptionWorkspace.activatedAt = new Date();

      await this.workspaceLimitRepository.saveSubscriptionWorkspace(
        existedSubscriptionWorkspace,
        manager,
      );
    } else {
      const subscriptionWorkspace =
        this.workspaceLimitRepository.createSubscriptionWorkspace({
          subscriptionId: activeSubscription.id,
          workspaceId,
        });

      await this.workspaceLimitRepository.saveSubscriptionWorkspace(
        subscriptionWorkspace,
        manager,
      );
    }

    await this.applyUsageLimit({
      workspaceId,
      plan,
      manager,
      source: 'workspace_create',
    });
  }

  private async applyFreeUsageLimit(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const freePlan = await this.workspaceLimitRepository.findActivePlanBySlug(
      FREE_PLAN_SLUG,
      manager,
    );

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
    const limits = mergePlanLimits(input.plan);

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
    for (const resourceType of Object.values(UsageResourceType)) {
      const limitKey = RESOURCE_LIMIT_KEY_MAP[resourceType];

      const limitValue = getNullableNumberLimit(input.limits, limitKey);

      if (limitValue === undefined) {
        continue;
      }

      const existed = await this.workspaceLimitRepository.findUsageLimit(
        input.workspaceId,
        resourceType,
        input.manager,
      );

      if (existed) {
        existed.planId = input.planId;
        existed.limitValue = limitValue;
        existed.metadata = {
          source: input.source,
          planSlug: input.planSlug,
        };

        await this.workspaceLimitRepository.saveUsageLimit(
          existed,
          input.manager,
        );
        continue;
      }

      const usageLimit = this.workspaceLimitRepository.createUsageLimit({
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

      await this.workspaceLimitRepository.saveUsageLimit(
        usageLimit,
        input.manager,
      );
    }
  }
}
