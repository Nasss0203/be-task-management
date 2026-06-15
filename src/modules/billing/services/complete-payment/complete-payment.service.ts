import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
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
import { RESOURCE_LIMIT_KEY_MAP } from '../../constants/default-plan-limits.constant';
import {
  type CompletePaymentInput,
  type CompletePaymentService,
} from '../../interfaces/services/complete-payment/complete-payment.service.interface';
import {
  getNullableNumberLimit,
  getNumberLimit,
  mergePlanLimits,
} from '../../utils/plan-limit.util';

@Injectable()
export class CompletePaymentServiceImpl implements CompletePaymentService {
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

    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepository: Repository<UserWorkspace>,
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

    await this.activateUserWorkspacesIfHasSlot({
      subscription,
      plan,
      userId: payment.userId,
      targetWorkspaceId: payment.targetWorkspaceId,
    });

    payment.subscriptionId = subscription.id;

    await this.paymentRepository.save(payment);
  }

  private async activateUserWorkspacesIfHasSlot(input: {
    subscription: Subscription;
    plan: Plan;
    userId: string;
    targetWorkspaceId: string | null;
  }): Promise<void> {
    const workspaceIds = await this.findActiveWorkspaceIdsByUserId(
      input.userId,
    );

    const orderedWorkspaceIds = this.prioritizeTargetWorkspace(
      workspaceIds,
      input.targetWorkspaceId,
    );

    for (const workspaceId of orderedWorkspaceIds) {
      const activated = await this.activateWorkspaceIfHasSlot({
        subscription: input.subscription,
        plan: input.plan,
        workspaceId,
      });

      if (!activated) {
        return;
      }
    }
  }

  private findActiveWorkspaceIdsByUserId(userId: string): Promise<string[]> {
    return this.userWorkspaceRepository
      .createQueryBuilder('uw')
      .select('uw.workspace_id', 'workspaceId')
      .innerJoin(Workspace, 'workspace', 'workspace.id = uw.workspace_id')
      .where('uw.user_id = :userId', { userId })
      .andWhere('workspace.deleted_at IS NULL')
      .orderBy('uw.last_opened_at', 'DESC', 'NULLS LAST')
      .addOrderBy('uw.joined_at', 'ASC')
      .getRawMany<{ workspaceId: string }>()
      .then((rows) => rows.map((row) => row.workspaceId));
  }

  private prioritizeTargetWorkspace(
    workspaceIds: string[],
    targetWorkspaceId: string | null,
  ): string[] {
    if (!targetWorkspaceId || !workspaceIds.includes(targetWorkspaceId)) {
      return workspaceIds;
    }

    return [
      targetWorkspaceId,
      ...workspaceIds.filter((workspaceId) => workspaceId !== targetWorkspaceId),
    ];
  }

  private async activateWorkspaceIfHasSlot(input: {
    subscription: Subscription;
    plan: Plan;
    workspaceId: string;
  }): Promise<boolean> {
    const limits = mergePlanLimits(input.plan);

    const upgradedWorkspaces = getNumberLimit(limits, 'upgradedWorkspaces', 1);

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
      return false;
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

    return true;
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
      const providerSubscriptionId =
        this.getProviderSubscriptionId(payment);
      const subscription = this.subscriptionRepository.create({
        userId: payment.userId,
        planId: plan.id,
        provider: payment.provider,
        providerSubscriptionId,
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
    currentSubscription.provider = payment.provider;
    currentSubscription.providerSubscriptionId =
      this.getProviderSubscriptionId(payment) ??
      currentSubscription.providerSubscriptionId;
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

  private getProviderSubscriptionId(payment: Payment): string | null {
    const value = payment.metadata?.stripeSubscriptionId;

    return typeof value === 'string' ? value : null;
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

  private async applyUsageLimit(input: {
    workspaceId: string;
    plan: Plan;
  }): Promise<void> {
    const limits = mergePlanLimits(input.plan);

    for (const resourceType of Object.values(UsageResourceType)) {
      const limitKey = RESOURCE_LIMIT_KEY_MAP[resourceType];
      const limitValue = getNullableNumberLimit(limits, limitKey);

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
}
