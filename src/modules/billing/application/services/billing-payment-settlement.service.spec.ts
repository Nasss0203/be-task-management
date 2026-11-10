import { BillingInterval } from '../../domain/constants/billing-interval.constant';
import { BillingProvider } from '../../domain/constants/billing-provider.constant';
import { PaymentOrderStatus } from '../../domain/constants/payment-order-status.constant';
import { BillingPlanPrice } from '../../domain/entities/billing-plan-price.entity';
import { PaymentOrder } from '../../domain/entities/payment-order.entity';
import { WorkspaceSubscription } from '../../domain/entities/workspace-subscription.entity';
import {
  BillingPaymentSettlementService,
  type SettleBillingPaymentInput,
} from './billing-payment-settlement.service';

const WORKSPACE_ID = 'workspace-1';
const ORDER_CODE = `TM${'B'.repeat(32)}`;

describe('BillingPaymentSettlementService', () => {
  let order: PaymentOrder;
  let subscription: WorkspaceSubscription;
  let planPrice: BillingPlanPrice;

  const orderRepository = {
    findByOrderCodeForUpdate: jest.fn((code: string) =>
      Promise.resolve(order.getOrderCode() === code ? order : null),
    ),
    save: jest.fn(),
  };
  const subscriptionRepository = {
    findByIdForUpdate: jest.fn(() => Promise.resolve(subscription)),
    save: jest.fn(),
  };
  const priceRepository = {
    findById: jest.fn(() => Promise.resolve(planPrice)),
  };
  const service = new BillingPaymentSettlementService(
    orderRepository as never,
    priceRepository as never,
    subscriptionRepository as never,
  );

  function setUpOrderAt(createdAt: Date) {
    order = PaymentOrder.create({
      id: 'order-1',
      workspaceId: WORKSPACE_ID,
      subscriptionId: subscription.getId(),
      planPriceId: 'price-1',
      provider: BillingProvider.SEPAY,
      orderCode: ORDER_CODE,
      amount: 99000,
      currency: 'VND',
      createdBy: 'actor',
      createdAt,
      expiresAt: new Date(createdAt.getTime() + 2 * 60 * 60_000),
    });
  }

  function setUp(params: {
    interval?: BillingInterval;
    createdAt?: Date;
    priceAmount?: number;
    subscriptionWorkspaceId?: string;
  }) {
    subscription = WorkspaceSubscription.createInitialFree({
      id: 'subscription-1',
      workspaceId: params.subscriptionWorkspaceId ?? WORKSPACE_ID,
      planId: 'plan-free',
    });
    planPrice = BillingPlanPrice.create({
      id: 'price-1',
      planId: 'plan-pro',
      provider: BillingProvider.SEPAY,
      billingInterval: params.interval ?? BillingInterval.MONTHLY,
      currency: 'VND',
      amount: params.priceAmount ?? 99000,
    });
    setUpOrderAt(params.createdAt ?? new Date('2026-01-31T04:00:00Z'));
  }

  function settle(overrides: Partial<SettleBillingPaymentInput> = {}) {
    const paidAt = new Date('2026-01-31T05:00:00Z');

    return service.settle({
      orderCode: ORDER_CODE,
      provider: BillingProvider.SEPAY,
      amount: 99000,
      currency: 'VND',
      paidAt,
      processedAt: paidAt,
      context: {} as never,
      ...overrides,
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    setUp({});
  });

  it('ignores a payment for an unknown order code', async () => {
    await expect(settle({ orderCode: `TM${'C'.repeat(32)}` })).resolves.toBe(
      'IGNORED',
    );
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(subscriptionRepository.save).not.toHaveBeenCalled();
  });

  it('locks the subscription row inside the settlement transaction', async () => {
    const context = { transaction: 'tx-1' };

    await settle({ context: context as never });

    expect(orderRepository.findByOrderCodeForUpdate).toHaveBeenCalledWith(
      ORDER_CODE,
      context,
    );
    expect(subscriptionRepository.findByIdForUpdate).toHaveBeenCalledWith(
      'subscription-1',
      context,
    );
  });

  it('accepts the currency in any case and spacing', async () => {
    await expect(settle({ currency: ' vnd ' })).resolves.toBe('PROCESSED');
    expect(order.getStatus()).toBe(PaymentOrderStatus.PAID);
    expect(subscription.getPlanId()).toBe('plan-pro');
  });

  it('ends a yearly plan paid on 29 February on 28 February next year', async () => {
    const paidAt = new Date('2028-02-29T05:00:00Z');
    setUp({
      interval: BillingInterval.YEARLY,
      createdAt: new Date('2028-02-29T04:00:00Z'),
    });

    await expect(settle({ paidAt, processedAt: paidAt })).resolves.toBe(
      'PROCESSED',
    );
    expect(subscription.getCurrentPeriodStart()).toEqual(paidAt);
    expect(subscription.getCurrentPeriodEnd()).toEqual(
      new Date('2029-02-28T05:00:00Z'),
    );
  });

  it('refuses to activate a subscription of another workspace', async () => {
    setUp({ subscriptionWorkspaceId: 'workspace-2' });

    await expect(settle()).rejects.toThrow('different workspaces');
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(subscriptionRepository.save).not.toHaveBeenCalled();
    expect(order.isPending()).toBe(true);
  });

  it('refuses to settle when the plan price changed after the order', async () => {
    setUp({ priceAmount: 129000 });

    await expect(settle()).rejects.toThrow(
      'Payment order does not match its billing plan price',
    );
    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(subscriptionRepository.save).not.toHaveBeenCalled();
  });

  describe('when the workspace already has a paid period', () => {
    const currentStart = new Date('2026-01-20T05:00:00Z');
    const currentEnd = new Date('2026-02-20T05:00:00Z');

    function activateCurrentPlan(planId = 'plan-pro') {
      subscription.activatePaidPlan({
        planId,
        planPriceId: 'price-current',
        provider: BillingProvider.SEPAY,
        periodStart: currentStart,
        periodEnd: currentEnd,
      });
    }

    it('adds the new month after the remaining days of the same plan', async () => {
      activateCurrentPlan();

      await expect(settle()).resolves.toBe('PROCESSED');
      expect(subscription.getCurrentPeriodStart()).toEqual(currentStart);
      expect(subscription.getCurrentPeriodEnd()).toEqual(
        new Date('2026-03-20T05:00:00Z'),
      );
    });

    it('keeps the remaining days when a scheduled cancellation is renewed', async () => {
      activateCurrentPlan();
      subscription.scheduleCancellation();

      await settle();

      expect(subscription.getCancelAtPeriodEnd()).toBe(false);
      expect(subscription.getCurrentPeriodEnd()).toEqual(
        new Date('2026-03-20T05:00:00Z'),
      );
    });

    it('continues from the old period end when paid during the grace period', async () => {
      activateCurrentPlan();
      subscription.markPastDue();
      const paidAt = new Date('2026-02-22T05:00:00Z');
      setUpOrderAt(paidAt);

      await settle({ paidAt, processedAt: paidAt });

      expect(subscription.getCurrentPeriodStart()).toEqual(currentStart);
      expect(subscription.getCurrentPeriodEnd()).toEqual(
        new Date('2026-03-20T05:00:00Z'),
      );
      expect(subscription.getBillingContactUserId()).toBe('actor');
    });

    it('starts from the payment time once the grace period has ended', async () => {
      activateCurrentPlan();
      const paidAt = new Date('2026-02-23T05:00:00Z');
      setUpOrderAt(paidAt);

      await settle({ paidAt, processedAt: paidAt });

      expect(subscription.getCurrentPeriodStart()).toEqual(paidAt);
      expect(subscription.getCurrentPeriodEnd()).toEqual(
        new Date('2026-03-23T05:00:00Z'),
      );
    });

    it('starts from the payment time after the end of a cancelled period', async () => {
      activateCurrentPlan();
      subscription.scheduleCancellation();
      const paidAt = new Date('2026-02-21T05:00:00Z');
      setUpOrderAt(paidAt);

      await settle({ paidAt, processedAt: paidAt });

      expect(subscription.getCurrentPeriodStart()).toEqual(paidAt);
      expect(subscription.getCancelAtPeriodEnd()).toBe(false);
    });

    it('starts from the payment time when switching to another plan', async () => {
      activateCurrentPlan('plan-team');

      await settle();

      expect(subscription.getPlanId()).toBe('plan-pro');
      expect(subscription.getCurrentPeriodStart()).toEqual(
        new Date('2026-01-31T05:00:00Z'),
      );
      expect(subscription.getCurrentPeriodEnd()).toEqual(
        new Date('2026-02-28T05:00:00Z'),
      );
    });

    it('starts from the payment time when the subscription was canceled', async () => {
      activateCurrentPlan();
      subscription.cancel();

      await settle();

      expect(subscription.getCurrentPeriodStart()).toEqual(
        new Date('2026-01-31T05:00:00Z'),
      );
    });
  });
});
