import { Inject, Injectable } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { BILLING_TYPES } from '../../billing.types';
import { BillingInterval } from '../../domain/constants/billing-interval.constant';
import { BillingProvider } from '../../domain/constants/billing-provider.constant';
import type { WorkspaceSubscription } from '../../domain/entities/workspace-subscription.entity';
import type { BillingPlanPriceRepository } from '../../domain/repositories/billing-plan-price.repository';
import type { PaymentOrderRepository } from '../../domain/repositories/payment-order.repository';
import type { WorkspaceSubscriptionRepository } from '../../domain/repositories/workspace-subscription.repository';

export type BillingPaymentSettlementResult = 'PROCESSED' | 'IGNORED';

export interface SettleBillingPaymentInput {
  orderCode: string;
  provider: BillingProvider;
  amount: number;
  currency: string;
  paidAt: Date;
  processedAt: Date;
  context: PersistenceContext;
}

@Injectable()
export class BillingPaymentSettlementService {
  constructor(
    @Inject(BILLING_TYPES.repositories.PaymentOrderRepository)
    private readonly paymentOrderRepository: PaymentOrderRepository,

    @Inject(BILLING_TYPES.repositories.BillingPlanPriceRepository)
    private readonly billingPlanPriceRepository: BillingPlanPriceRepository,

    @Inject(BILLING_TYPES.repositories.WorkspaceSubscriptionRepository)
    private readonly subscriptionRepository: WorkspaceSubscriptionRepository,
  ) {}

  async settle(
    input: SettleBillingPaymentInput,
  ): Promise<BillingPaymentSettlementResult> {
    const paymentOrder =
      await this.paymentOrderRepository.findByOrderCodeForUpdate(
        input.orderCode,
        input.context,
      );

    if (!paymentOrder) {
      return 'IGNORED';
    }

    if (
      paymentOrder.getProvider() !== input.provider ||
      paymentOrder.getCurrency() !== input.currency.trim().toUpperCase() ||
      paymentOrder.getAmount() !== input.amount
    ) {
      return 'IGNORED';
    }

    if (!paymentOrder.isPending()) {
      return 'IGNORED';
    }

    if (paymentOrder.isExpiredAt(input.paidAt)) {
      paymentOrder.markExpired(input.processedAt);

      await this.paymentOrderRepository.save(paymentOrder, input.context);

      return 'IGNORED';
    }

    const subscriptionId = paymentOrder.getSubscriptionId();

    if (!subscriptionId) {
      throw new Error(
        'Payment order is not linked to a workspace subscription',
      );
    }

    const [subscription, planPrice] = await Promise.all([
      this.subscriptionRepository.findByIdForUpdate(
        subscriptionId,
        input.context,
      ),
      this.billingPlanPriceRepository.findById(
        paymentOrder.getPlanPriceId(),
        input.context,
      ),
    ]);

    if (!subscription) {
      throw new Error('Workspace subscription not found');
    }

    if (!planPrice) {
      throw new Error('Billing plan price not found');
    }

    if (subscription.getWorkspaceId() !== paymentOrder.getWorkspaceId()) {
      throw new Error(
        'Payment order and subscription belong to different workspaces',
      );
    }

    if (
      planPrice.getProvider() !== paymentOrder.getProvider() ||
      planPrice.getAmount() !== paymentOrder.getAmount() ||
      planPrice.getCurrency() !== paymentOrder.getCurrency()
    ) {
      throw new Error('Payment order does not match its billing plan price');
    }

    const remainingPeriod = this.findRemainingPeriod(
      subscription,
      planPrice.getPlanId(),
      input.paidAt,
    );

    const periodEnd = this.calculatePeriodEnd(
      remainingPeriod?.end ?? input.paidAt,
      planPrice.getBillingInterval(),
    );

    paymentOrder.markPaid(input.paidAt);

    subscription.activatePaidPlan({
      planId: planPrice.getPlanId(),
      planPriceId: planPrice.getId(),
      provider: planPrice.getProvider(),
      periodStart: remainingPeriod?.start ?? input.paidAt,
      periodEnd,
      billingContactUserId: paymentOrder.getCreatedBy(),
      changedAt: input.processedAt,
    });

    await this.paymentOrderRepository.save(paymentOrder, input.context);
    await this.subscriptionRepository.save(subscription, input.context);

    return 'PROCESSED';
  }

  private findRemainingPeriod(
    subscription: WorkspaceSubscription,
    planId: string,
    paidAt: Date,
  ): { start: Date; end: Date } | null {
    const start = subscription.getCurrentPeriodStart();
    const end = subscription.getCurrentPeriodEnd();

    const isRenewingActivePaidPlan =
      subscription.getPlanPriceId() !== null &&
      subscription.getPlanId() === planId &&
      start !== null &&
      end !== null &&
      subscription.hasPaidAccessAt(paidAt);

    return isRenewingActivePaidPlan ? { start, end } : null;
  }

  private calculatePeriodEnd(
    periodStart: Date,
    billingInterval: BillingInterval,
  ): Date {
    const months = billingInterval === BillingInterval.MONTHLY ? 1 : 12;

    const result = new Date(periodStart);
    const originalDay = result.getUTCDate();

    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months);

    const lastDayOfTargetMonth = new Date(
      Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
    ).getUTCDate();

    result.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));

    return result;
  }
}
