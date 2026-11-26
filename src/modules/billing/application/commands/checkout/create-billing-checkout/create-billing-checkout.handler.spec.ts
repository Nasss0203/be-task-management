import { HttpException } from '@nestjs/common';

import { ErrorCode } from 'src/common/constants/error-code.constant';

import { BillingInterval } from '../../../../domain/constants/billing-interval.constant';
import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { SubscriptionStatus } from '../../../../domain/constants/subscription-status.constant';
import { BillingPlanPrice } from '../../../../domain/entities/billing-plan-price.entity';
import { PaymentOrder } from '../../../../domain/entities/payment-order.entity';
import { WorkspaceSubscription } from '../../../../domain/entities/workspace-subscription.entity';
import { PlanChangeQuoteService } from '../../../services/plan-change-quote.service';
import { CreateBillingCheckoutCommand } from './create-billing-checkout.command';
import { CreateBillingCheckoutHandler } from './create-billing-checkout.handler';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('CreateBillingCheckoutHandler', () => {
  const plusPrice = BillingPlanPrice.create({
    id: 'price-plus',
    planId: 'plan-plus',
    provider: BillingProvider.STRIPE,
    billingInterval: BillingInterval.MONTHLY,
    currency: 'VND',
    amount: 99000,
  });
  const businessPrice = BillingPlanPrice.create({
    id: 'price-business',
    planId: 'plan-business',
    provider: BillingProvider.STRIPE,
    billingInterval: BillingInterval.MONTHLY,
    currency: 'VND',
    amount: 249000,
  });
  const prices = [plusPrice, businessPrice];

  const planPriceRepository = {
    findActiveById: jest.fn((id: string) =>
      Promise.resolve(prices.find((item) => item.getId() === id) ?? null),
    ),
    findById: jest.fn((id: string) =>
      Promise.resolve(prices.find((item) => item.getId() === id) ?? null),
    ),
  };
  const paymentOrderRepository = {
    lockWorkspace: jest.fn(),
    findUnexpiredPendingByWorkspaceIdAndPlanPriceId: jest.fn(),
    save: jest.fn((order: PaymentOrder) => Promise.resolve(order)),
  };
  const provisioningService = { getOrCreateInitialFree: jest.fn() };
  const stripeCheckoutService = {
    createCheckout: jest.fn().mockResolvedValue({
      checkoutUrl: 'https://checkout.test/session',
      checkoutMethod: 'GET',
      checkoutFields: {},
    }),
  };
  const unitOfWork = {
    runInTransaction: jest.fn((work: (context: unknown) => unknown) =>
      work({}),
    ),
  };

  const handler = new CreateBillingCheckoutHandler(
    planPriceRepository as never,
    paymentOrderRepository as never,
    provisioningService as never,
    new PlanChangeQuoteService(planPriceRepository as never),
    {} as never,
    stripeCheckoutService as never,
    unitOfWork as never,
  );

  function activeSubscription(
    current: BillingPlanPrice,
    daysLeft: number,
  ): WorkspaceSubscription {
    const periodEnd = new Date(Date.now() + daysLeft * DAY_MS + 60 * 60 * 1000);

    return WorkspaceSubscription.reconstitute({
      id: 'subscription-1',
      workspaceId: 'workspace-1',
      planId: current.getPlanId(),
      planPriceId: current.getId(),
      provider: BillingProvider.STRIPE,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(periodEnd.getTime() - 30 * DAY_MS),
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      providerCustomerId: null,
      providerSubscriptionId: null,
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
      updatedAt: new Date('2026-11-01T00:00:00.000Z'),
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    paymentOrderRepository.findUnexpiredPendingByWorkspaceIdAndPlanPriceId.mockResolvedValue(
      null,
    );
  });

  it('charges a higher plan minus the credit for the remaining days', async () => {
    provisioningService.getOrCreateInitialFree.mockResolvedValue(
      activeSubscription(plusPrice, 26),
    );

    const result = await handler.execute(
      new CreateBillingCheckoutCommand(
        'workspace-1',
        'price-business',
        'user-1',
      ),
    );

    const saved = paymentOrderRepository.save.mock.calls[0][0];
    expect(saved.getCreditAmount()).toBeGreaterThan(0);
    expect(saved.getAmount()).toBe(249000 - saved.getCreditAmount());
    expect(result.amount).toBe(saved.getAmount());
    expect(result.creditAmount).toBe(saved.getCreditAmount());
    expect(stripeCheckoutService.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ amount: saved.getAmount() }),
    );
  });

  it('rejects a lower plan during the paid period without saving an order', async () => {
    provisioningService.getOrCreateInitialFree.mockResolvedValue(
      activeSubscription(businessPrice, 20),
    );

    const execution = handler.execute(
      new CreateBillingCheckoutCommand('workspace-1', 'price-plus', 'user-1'),
    );

    await expect(execution).rejects.toBeInstanceOf(HttpException);
    await expect(execution).rejects.toMatchObject({
      response: { code: ErrorCode.PLAN_DOWNGRADE_NOT_ALLOWED },
    });
    expect(paymentOrderRepository.save).not.toHaveBeenCalled();
  });

  it('reuses a pending order with its original amount', async () => {
    const subscription = activeSubscription(plusPrice, 26);
    const pending = PaymentOrder.create({
      workspaceId: 'workspace-1',
      subscriptionId: subscription.getId(),
      planPriceId: 'price-business',
      provider: BillingProvider.STRIPE,
      orderCode: 'TMPENDING1',
      amount: 160000,
      creditAmount: 89000,
      currency: 'VND',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      createdBy: 'user-1',
    });
    provisioningService.getOrCreateInitialFree.mockResolvedValue(subscription);
    paymentOrderRepository.findUnexpiredPendingByWorkspaceIdAndPlanPriceId.mockResolvedValue(
      pending,
    );

    const result = await handler.execute(
      new CreateBillingCheckoutCommand(
        'workspace-1',
        'price-business',
        'user-1',
      ),
    );

    expect(result.amount).toBe(160000);
    expect(result.creditAmount).toBe(89000);
    expect(paymentOrderRepository.save).not.toHaveBeenCalled();
  });
});
