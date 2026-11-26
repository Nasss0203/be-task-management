import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

import { ErrorCode } from 'src/common/constants/error-code.constant';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { BILLING_TYPES } from '../../billing.types';
import { BillingInterval } from '../../domain/constants/billing-interval.constant';
import { SubscriptionStatus } from '../../domain/constants/subscription-status.constant';
import type { BillingPlanPrice } from '../../domain/entities/billing-plan-price.entity';
import type { WorkspaceSubscription } from '../../domain/entities/workspace-subscription.entity';
import type { BillingPlanPriceRepository } from '../../domain/repositories/billing-plan-price.repository';

export const MIN_CHECKOUT_AMOUNT = 20000;

const DAY_MS = 24 * 60 * 60 * 1000;

export type PlanChangeBlock = {
  code:
    | ErrorCode.PLAN_DOWNGRADE_NOT_ALLOWED
    | ErrorCode.PLAN_CHANGE_CREDIT_TOO_HIGH;
  availableFrom: Date;
};

export type PlanChangeQuote = {
  listAmount: number;
  creditAmount: number;
  amount: number;
  blocked: PlanChangeBlock | null;
};

const BLOCK_MESSAGES: Record<PlanChangeBlock['code'], string> = {
  [ErrorCode.PLAN_DOWNGRADE_NOT_ALLOWED]:
    'You can move to a lower plan after the current billing period ends. Cancel your plan and buy the new one after it ends.',
  [ErrorCode.PLAN_CHANGE_CREDIT_TOO_HIGH]:
    'The current billing period has too many days left to change plans. Change plans when fewer days are left.',
};

export function shiftByInterval(
  from: Date,
  interval: BillingInterval,
  direction: 1 | -1,
): Date {
  const months = (interval === BillingInterval.MONTHLY ? 1 : 12) * direction;
  const result = new Date(from);
  const originalDay = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));

  return result;
}

function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

@Injectable()
export class PlanChangeQuoteService {
  constructor(
    @Inject(BILLING_TYPES.repositories.BillingPlanPriceRepository)
    private readonly planPriceRepository: BillingPlanPriceRepository,
  ) {}

  async quote(
    subscription: WorkspaceSubscription | null,
    newPrice: BillingPlanPrice,
    now: Date,
    context?: PersistenceContext,
  ): Promise<PlanChangeQuote> {
    const listAmount = newPrice.getAmount();
    const fullPrice: PlanChangeQuote = {
      listAmount,
      creditAmount: 0,
      amount: listAmount,
      blocked: null,
    };
    const currentPriceId = subscription?.getPlanPriceId();
    const periodEnd = subscription?.getCurrentPeriodEnd();

    if (
      !subscription ||
      !currentPriceId ||
      !periodEnd ||
      subscription.getStatus() !== SubscriptionStatus.ACTIVE ||
      now.getTime() >= periodEnd.getTime() ||
      subscription.getPlanId() === newPrice.getPlanId()
    ) {
      return fullPrice;
    }

    const currentPrice = await this.planPriceRepository.findById(
      currentPriceId,
      context,
    );

    if (!currentPrice) {
      return fullPrice;
    }

    const currentPeriodDays = daysBetween(
      shiftByInterval(periodEnd, currentPrice.getBillingInterval(), -1),
      periodEnd,
    );
    const newPeriodDays = daysBetween(
      now,
      shiftByInterval(now, newPrice.getBillingInterval(), 1),
    );

    if (
      listAmount * currentPeriodDays <
      currentPrice.getAmount() * newPeriodDays
    ) {
      return {
        ...fullPrice,
        blocked: {
          code: ErrorCode.PLAN_DOWNGRADE_NOT_ALLOWED,
          availableFrom: periodEnd,
        },
      };
    }

    const remainingDays = Math.floor(
      (periodEnd.getTime() - now.getTime()) / DAY_MS,
    );
    const creditAmount = Math.floor(
      (currentPrice.getAmount() * remainingDays) / currentPeriodDays,
    );
    const amount = listAmount - creditAmount;

    if (creditAmount > 0 && amount < MIN_CHECKOUT_AMOUNT) {
      const allowedRemainingDays = Math.floor(
        ((listAmount - MIN_CHECKOUT_AMOUNT) * currentPeriodDays) /
          currentPrice.getAmount(),
      );

      return {
        ...fullPrice,
        blocked: {
          code: ErrorCode.PLAN_CHANGE_CREDIT_TOO_HIGH,
          availableFrom: new Date(
            periodEnd.getTime() - (allowedRemainingDays + 1) * DAY_MS + 1,
          ),
        },
      };
    }

    return { listAmount, creditAmount, amount, blocked: null };
  }

  assertAllowed(quote: PlanChangeQuote): void {
    if (!quote.blocked) {
      return;
    }

    throw new HttpException(
      {
        code: quote.blocked.code,
        message: BLOCK_MESSAGES[quote.blocked.code],
        details: { availableFrom: quote.blocked.availableFrom.toISOString() },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
