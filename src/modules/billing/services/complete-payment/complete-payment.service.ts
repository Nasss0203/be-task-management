import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Payment, PaymentStatus } from '../../domain/entities/payment.entity';
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

export interface CompletePaymentInput {
  paymentId: string;
}

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

const DEFAULT_PLAN_LIMITS: Record<string, Record<string, number | null>> = {
  free: {
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

  'pro-monthly': {
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

@Injectable()
export class CompletePaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(SubscriptionWorkspace)
    private readonly subscriptionWorkspaceRepository: Repository<SubscriptionWorkspace>,

    @InjectRepository(UsageLimit)
    private readonly usageLimitRepository: Repository<UsageLimit>,
  ) {}

  async complete(input: CompletePaymentInput): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: {
        id: input.paymentId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      return;
    }

    if (payment.subscriptionId) {
      return;
    }

    const plan = await this.planRepository.findOne({
      where: {
        id: payment.planId,
        isActive: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const subscription = await this.createOrRenewSubscription(payment, plan);

    if (payment.targetWorkspaceId) {
      await this.activateWorkspaceIfHasSlot({
        subscription,
        plan,
        workspaceId: payment.targetWorkspaceId,
      });
    }

    payment.subscriptionId = subscription.id;

    await this.paymentRepository.save(payment);
  }

  private async createOrRenewSubscription(
    payment: Payment,
    plan: Plan,
  ): Promise<Subscription> {
    const currentSubscription = await this.subscriptionRepository.findOne({
      where: {
        userId: payment.userId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const now = new Date();

    const periodStart = currentSubscription?.currentPeriodEnd
      ? new Date(
          Math.max(
            currentSubscription.currentPeriodEnd.getTime(),
            now.getTime(),
          ),
        )
      : now;

    const periodEnd = this.calculatePeriodEnd(periodStart, plan);

    if (!currentSubscription) {
      const subscription = this.subscriptionRepository.create({
        userId: payment.userId,
        planId: plan.id,
        provider: BillingProvider.VNPAY,
        providerSubscriptionId: null,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        metadata: {
          paymentId: payment.id,
          orderCode: payment.orderCode,
        },
      });

      return this.subscriptionRepository.save(subscription);
    }

    currentSubscription.planId = plan.id;
    currentSubscription.provider = BillingProvider.VNPAY;
    currentSubscription.status = SubscriptionStatus.ACTIVE;
    currentSubscription.currentPeriodStart = periodStart;
    currentSubscription.currentPeriodEnd = periodEnd;
    currentSubscription.cancelAtPeriodEnd = false;
    currentSubscription.cancelledAt = null;
    currentSubscription.metadata = {
      ...(currentSubscription.metadata ?? {}),
      lastPaymentId: payment.id,
      lastOrderCode: payment.orderCode,
    };

    return this.subscriptionRepository.save(currentSubscription);
  }

  private calculatePeriodEnd(start: Date, plan: Plan): Date | null {
    if (plan.billingInterval === PlanBillingInterval.LIFETIME) {
      return null;
    }

    const end = new Date(start);

    if (plan.billingInterval === PlanBillingInterval.YEAR) {
      end.setFullYear(end.getFullYear() + 1);
      return end;
    }

    end.setMonth(end.getMonth() + 1);
    return end;
  }

  private async activateWorkspaceIfHasSlot(input: {
    subscription: Subscription;
    plan: Plan;
    workspaceId: string;
  }): Promise<void> {
    const limits = this.mergePlanLimits(input.plan);

    const upgradedWorkspaces = this.getNumberLimit(
      limits,
      'upgradedWorkspaces',
      1,
    );

    const activeCount = await this.subscriptionWorkspaceRepository.count({
      where: {
        subscriptionId: input.subscription.id,
      },
    });

    const existedWorkspace = await this.subscriptionWorkspaceRepository.findOne(
      {
        where: {
          workspaceId: input.workspaceId,
        },
      },
    );

    if (!existedWorkspace && activeCount >= upgradedWorkspaces) {
      return;
    }

    if (existedWorkspace) {
      existedWorkspace.subscriptionId = input.subscription.id;
      existedWorkspace.activatedAt = new Date();

      await this.subscriptionWorkspaceRepository.save(existedWorkspace);
    } else {
      const subscriptionWorkspace = this.subscriptionWorkspaceRepository.create(
        {
          subscriptionId: input.subscription.id,
          workspaceId: input.workspaceId,
          activatedAt: new Date(),
        },
      );

      await this.subscriptionWorkspaceRepository.save(subscriptionWorkspace);
    }

    await this.applyUsageLimit({
      workspaceId: input.workspaceId,
      plan: input.plan,
    });
  }

  private async applyUsageLimit(input: {
    workspaceId: string;
    plan: Plan;
  }): Promise<void> {
    const limits = this.mergePlanLimits(input.plan);

    for (const resourceType of Object.values(UsageResourceType)) {
      const limitKey = RESOURCE_LIMIT_KEY_MAP[resourceType];
      const limitValue = this.getNullableNumberLimit(limits, limitKey);

      if (limitValue === undefined) {
        continue;
      }

      const existed = await this.usageLimitRepository.findOne({
        where: {
          workspaceId: input.workspaceId,
          resourceType,
        },
      });

      if (existed) {
        existed.planId = input.plan.id;
        existed.limitValue = limitValue;
        existed.metadata = {
          source: 'payment',
          planSlug: input.plan.slug,
        };

        await this.usageLimitRepository.save(existed);
        continue;
      }

      const usageLimit = this.usageLimitRepository.create({
        workspaceId: input.workspaceId,
        planId: input.plan.id,
        resourceType,
        limitValue,
        usedValue: 0,
        resetAt: null,
        metadata: {
          source: 'payment',
          planSlug: input.plan.slug,
        },
      });

      await this.usageLimitRepository.save(usageLimit);
    }
  }

  private mergePlanLimits(plan: Plan): Record<string, unknown> {
    const defaultLimits = DEFAULT_PLAN_LIMITS[plan.slug] ?? {};
    const customLimits = plan.limits ?? {};

    return {
      ...defaultLimits,
      ...customLimits,
    };
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
}
