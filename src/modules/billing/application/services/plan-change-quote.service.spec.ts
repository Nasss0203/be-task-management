import { HttpException } from '@nestjs/common';

import { ErrorCode } from 'src/common/constants/error-code.constant';

import { BillingInterval } from '../../domain/constants/billing-interval.constant';
import { BillingProvider } from '../../domain/constants/billing-provider.constant';
import { SubscriptionStatus } from '../../domain/constants/subscription-status.constant';
import { BillingPlanPrice } from '../../domain/entities/billing-plan-price.entity';
import { WorkspaceSubscription } from '../../domain/entities/workspace-subscription.entity';
import { PlanChangeQuoteService } from './plan-change-quote.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const PERIOD_END = new Date('2026-12-19T07:04:00.000Z');

function price(
  id: string,
  planId: string,
  amount: number,
  billingInterval = BillingInterval.MONTHLY,
): BillingPlanPrice {
  return BillingPlanPrice.create({
    id,
    planId,
    provider: BillingProvider.STRIPE,
    billingInterval,
    currency: 'VND',
    amount,
  });
}

const plusMonthly = price('price-plus', 'plan-plus', 99000);
const plusYearly = price(
  'price-plus-year',
  'plan-plus',
  990000,
  BillingInterval.YEARLY,
);
const businessMonthly = price('price-business', 'plan-business', 249000);
const businessYearly = price(
  'price-business-year',
  'plan-business',
  2490000,
  BillingInterval.YEARLY,
);
const prices = [plusMonthly, plusYearly, businessMonthly, businessYearly];

function subscription(
  current: BillingPlanPrice,
  overrides: { status?: SubscriptionStatus; periodEnd?: Date } = {},
): WorkspaceSubscription {
  return WorkspaceSubscription.reconstitute({
    id: 'subscription-1',
    workspaceId: 'workspace-1',
    planId: current.getPlanId(),
    planPriceId: current.getId(),
    provider: BillingProvider.STRIPE,
    status: overrides.status ?? SubscriptionStatus.ACTIVE,
    currentPeriodStart: new Date('2026-11-19T07:04:00.000Z'),
    currentPeriodEnd: overrides.periodEnd ?? PERIOD_END,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    createdAt: new Date('2026-11-19T07:04:00.000Z'),
    updatedAt: new Date('2026-11-19T07:04:00.000Z'),
  });
}

describe('PlanChangeQuoteService', () => {
  const planPriceRepository = {
    findById: jest.fn((id: string) =>
      Promise.resolve(prices.find((item) => item.getId() === id) ?? null),
    ),
  };
  const service = new PlanChangeQuoteService(planPriceRepository as never);
  const before = (ms: number) => new Date(PERIOD_END.getTime() - ms);

  it('credits one remaining day of Plus when moving to Business', async () => {
    const quote = await service.quote(
      subscription(plusMonthly),
      businessMonthly,
      before(DAY_MS + HOUR_MS),
    );

    expect(quote).toEqual({
      listAmount: 249000,
      creditAmount: 3300,
      amount: 245700,
      blocked: null,
    });
  });

  it('credits 26 remaining days of Plus when moving to Business', async () => {
    const quote = await service.quote(
      subscription(plusMonthly),
      businessMonthly,
      before(26 * DAY_MS + HOUR_MS),
    );

    expect(quote.creditAmount).toBe(85800);
    expect(quote.amount).toBe(163200);
  });

  it('gives no credit when less than a full day is left', async () => {
    const quote = await service.quote(
      subscription(plusMonthly),
      businessMonthly,
      before(19 * HOUR_MS),
    );

    expect(quote).toEqual({
      listAmount: 249000,
      creditAmount: 0,
      amount: 249000,
      blocked: null,
    });
  });

  it('uses the real length of a 31-day period', async () => {
    const quote = await service.quote(
      subscription(plusMonthly, {
        periodEnd: new Date('2027-01-19T07:04:00.000Z'),
      }),
      businessMonthly,
      new Date('2027-01-09T06:00:00.000Z'),
    );

    expect(quote.creditAmount).toBe(Math.floor((99000 * 10) / 31));
  });

  it('credits a monthly plan toward a yearly higher plan', async () => {
    const quote = await service.quote(
      subscription(plusMonthly),
      businessYearly,
      before(26 * DAY_MS + HOUR_MS),
    );

    expect(quote.creditAmount).toBe(85800);
    expect(quote.amount).toBe(2490000 - 85800);
  });

  it('blocks moving from Business to Plus during the period', async () => {
    const quote = await service.quote(
      subscription(businessMonthly),
      plusMonthly,
      before(29 * DAY_MS + HOUR_MS),
    );

    expect(quote.blocked).toEqual({
      code: ErrorCode.PLAN_DOWNGRADE_NOT_ALLOWED,
      availableFrom: PERIOD_END,
    });
    expect(quote.amount).toBe(99000);
  });

  it('blocks a change whose credit leaves less than the minimum charge', async () => {
    const periodEnd = new Date('2027-02-16T07:04:00.000Z');
    const now = new Date(periodEnd.getTime() - 89 * DAY_MS - HOUR_MS);
    const quote = await service.quote(
      subscription(plusMonthly, { periodEnd }),
      businessMonthly,
      now,
    );

    expect(quote.blocked?.code).toBe(ErrorCode.PLAN_CHANGE_CREDIT_TOO_HIGH);

    const availableFrom = quote.blocked!.availableFrom;
    const atAvailableFrom = await service.quote(
      subscription(plusMonthly, { periodEnd }),
      businessMonthly,
      availableFrom,
    );
    const justBefore = await service.quote(
      subscription(plusMonthly, { periodEnd }),
      businessMonthly,
      new Date(availableFrom.getTime() - 1),
    );

    expect(atAvailableFrom.blocked).toBeNull();
    expect(atAvailableFrom.amount).toBeGreaterThanOrEqual(20000);
    expect(justBefore.blocked?.code).toBe(
      ErrorCode.PLAN_CHANGE_CREDIT_TOO_HIGH,
    );
  });

  it.each([
    [
      'the same plan on another interval',
      subscription(plusMonthly),
      plusYearly,
    ],
    [
      'a subscription in its grace period',
      subscription(plusMonthly, { status: SubscriptionStatus.PAST_DUE }),
      businessMonthly,
    ],
    ['no subscription', null, businessMonthly],
  ])('charges the full price for %s', async (_, current, target) => {
    const quote = await service.quote(current, target, before(10 * DAY_MS));

    expect(quote).toEqual({
      listAmount: target.getAmount(),
      creditAmount: 0,
      amount: target.getAmount(),
      blocked: null,
    });
  });

  it('throws a 400 with the date the change becomes possible', () => {
    expect.assertions(2);

    try {
      service.assertAllowed({
        listAmount: 99000,
        creditAmount: 0,
        amount: 99000,
        blocked: {
          code: ErrorCode.PLAN_DOWNGRADE_NOT_ALLOWED,
          availableFrom: PERIOD_END,
        },
      });
    } catch (error) {
      const exception = error as HttpException;
      expect(exception.getStatus()).toBe(400);
      expect(exception.getResponse()).toMatchObject({
        code: ErrorCode.PLAN_DOWNGRADE_NOT_ALLOWED,
        details: { availableFrom: PERIOD_END.toISOString() },
      });
    }
  });
});
