import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { ErrorCode } from 'src/common/constants/error-code.constant';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { BILLING_TYPES } from '../../billing.types';
import { BillingFeatureCode } from '../../domain/constants/billing-feature-code.constant';
import { SubscriptionStatus } from '../../domain/constants/subscription-status.constant';
import type { BillingPlan } from '../../domain/entities/billing-plan.entity';
import type { WorkspaceSubscription } from '../../domain/entities/workspace-subscription.entity';
import type { BillingFeatureRepository } from '../../domain/repositories/billing-feature.repository';
import type { BillingPlanFeatureRepository } from '../../domain/repositories/billing-plan-feature.repository';
import type { BillingPlanRepository } from '../../domain/repositories/billing-plan.repository';
import type { WorkspaceSubscriptionRepository } from '../../domain/repositories/workspace-subscription.repository';
import type {
  WorkspaceEntitlementFeatureDto,
  WorkspaceEntitlementsResponseDto,
} from '../dto/response/workspace-entitlements.response.dto';
import type { WorkspaceEntitlementPort } from '../ports/workspace-entitlement.port';
import type {
  UsagePeriod,
  WorkspaceUsage,
  WorkspaceUsageReader,
} from '../ports/workspace-usage-reader.port';

const FREE_PLAN_CODE = 'FREE';
const BYTES_PER_MB = 1024 * 1024;

type PaidPeriod = { start: Date; end: Date };

@Injectable()
export class BillingEntitlementService implements WorkspaceEntitlementPort {
  constructor(
    @Inject(BILLING_TYPES.repositories.WorkspaceSubscriptionRepository)
    private readonly subscriptionRepository: WorkspaceSubscriptionRepository,

    @Inject(BILLING_TYPES.repositories.BillingPlanRepository)
    private readonly planRepository: BillingPlanRepository,

    @Inject(BILLING_TYPES.repositories.BillingFeatureRepository)
    private readonly featureRepository: BillingFeatureRepository,

    @Inject(BILLING_TYPES.repositories.BillingPlanFeatureRepository)
    private readonly planFeatureRepository: BillingPlanFeatureRepository,

    @Inject(BILLING_TYPES.services.WorkspaceUsageReader)
    private readonly usageReader: WorkspaceUsageReader,
  ) {}

  async getEntitlements(
    workspaceId: string,
    now = new Date(),
    context?: PersistenceContext,
  ): Promise<WorkspaceEntitlementsResponseDto> {
    const subscription =
      await this.subscriptionRepository.findByWorkspaceId(workspaceId);
    const paidPeriod = this.resolvePaidPeriod(subscription, now);
    const plan = await this.resolvePlan(subscription, paidPeriod);
    const usagePeriod = paidPeriod ?? this.calendarMonth(now);

    const [features, planFeatures, usage] = await Promise.all([
      this.featureRepository.findAll(),
      this.planFeatureRepository.findByPlanId(plan.getId()),
      this.usageReader.getUsage(workspaceId, usagePeriod, now, context),
    ]);
    const valuesByFeatureId = new Map(
      planFeatures.map((planFeature) => [
        planFeature.getFeatureId(),
        planFeature.getValue(),
      ]),
    );

    return {
      workspaceId,
      plan: { id: plan.getId(), code: plan.getCode(), name: plan.getName() },
      periodStart: paidPeriod?.start ?? null,
      periodEnd: paidPeriod?.end ?? null,
      usagePeriod,
      features: features.flatMap((feature) => {
        const limit = valuesByFeatureId.get(feature.getId());

        if (limit === undefined) {
          return [];
        }

        return [
          {
            code: feature.getCode(),
            name: feature.getName(),
            valueType: feature.getValueType(),
            limit,
            usage: this.usageFor(feature.getCode(), usage),
          },
        ];
      }),
    };
  }

  async assertWithinLimit(
    workspaceId: string,
    feature: BillingFeatureCode,
    increment = 1,
    context?: PersistenceContext,
  ): Promise<void> {
    if (context) {
      await this.usageReader.lockWorkspace(workspaceId, context);
    }

    const entitlements = await this.getEntitlements(
      workspaceId,
      new Date(),
      context,
    );
    const entitlement = entitlements.features.find(
      (item) => item.code === String(feature),
    );

    if (!entitlement || this.isWithinLimit(entitlement, increment)) {
      return;
    }

    throw new HttpException(
      {
        code: ErrorCode.WORKSPACE_LIMIT_EXCEEDED,
        message: `Workspace plan limit reached: ${feature}`,
        details: {
          feature,
          limit: entitlement.limit,
          usage: entitlement.usage,
        },
      },
      HttpStatus.FORBIDDEN,
    );
  }

  private isWithinLimit(
    entitlement: WorkspaceEntitlementFeatureDto,
    increment: number,
  ): boolean {
    if (typeof entitlement.limit === 'boolean') {
      return entitlement.limit;
    }

    if (typeof entitlement.limit !== 'number') {
      return true;
    }

    return (entitlement.usage ?? 0) + increment <= entitlement.limit;
  }

  private resolvePaidPeriod(
    subscription: WorkspaceSubscription | null,
    now: Date,
  ): PaidPeriod | null {
    const start = subscription?.getCurrentPeriodStart();
    const end = subscription?.getCurrentPeriodEnd();

    if (!subscription || !start || !end || !subscription.hasPaidAccessAt(now)) {
      return null;
    }

    return { start, end };
  }

  private async resolvePlan(
    subscription: WorkspaceSubscription | null,
    paidPeriod: PaidPeriod | null,
  ): Promise<BillingPlan> {
    const isUnexpiredPlan =
      paidPeriod !== null ||
      (subscription?.getStatus() === SubscriptionStatus.ACTIVE &&
        subscription.getCurrentPeriodEnd() === null &&
        subscription.getCurrentPeriodStart() === null);

    const plan =
      isUnexpiredPlan && subscription
        ? await this.planRepository.findById(subscription.getPlanId())
        : await this.planRepository.findByCode(FREE_PLAN_CODE);

    if (!plan) {
      throw new InternalServerErrorException(
        isUnexpiredPlan
          ? 'Workspace subscription billing plan is not configured'
          : 'FREE billing plan is not configured',
      );
    }

    return plan;
  }

  private calendarMonth(now: Date): UsagePeriod {
    return {
      start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
    };
  }

  private usageFor(code: string, usage: WorkspaceUsage): number | null {
    const usageByCode: Record<string, number> = {
      [BillingFeatureCode.MAX_MEMBERS]: usage.members,
      [BillingFeatureCode.MAX_TEAMSPACES]: usage.teamspaces,
      [BillingFeatureCode.MAX_STORAGE_MB]: usage.storageBytes / BYTES_PER_MB,
      [BillingFeatureCode.AI_REQUESTS_MONTHLY]: usage.aiRequests,
    };

    return usageByCode[code] ?? null;
  }
}
