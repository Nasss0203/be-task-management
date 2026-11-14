import { BadRequestException } from '@nestjs/common';
import type Stripe from 'stripe';

import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { BillingWebhookStatus } from '../../../../domain/constants/billing-webhook-status.constant';
import type { BillingWebhookEvent } from '../../../../domain/entities/billing-webhook-event.entity';
import { PaymentOrder } from '../../../../domain/entities/payment-order.entity';
import { ProcessStripeWebhookCommand } from './process-stripe-webhook.command';
import { ProcessStripeWebhookHandler } from './process-stripe-webhook.handler';

const ORDER_CODE = `TM${'D4'.repeat(16)}`;

type SessionOverrides = Record<string, unknown>;

describe('ProcessStripeWebhookHandler', () => {
  let order: PaymentOrder;

  const webhookEventRepository = {
    insertIfAbsent: jest.fn<Promise<boolean>, [BillingWebhookEvent]>(),
    save: jest.fn<Promise<void>, [BillingWebhookEvent]>(),
  };
  const paymentOrderRepository = {
    findByOrderCodeForUpdate: jest.fn(() => Promise.resolve(order)),
    save: jest.fn(),
  };
  const settlement = {
    settle: jest.fn(),
  };
  const unitOfWork = {
    runInTransaction: jest.fn((work: (context: unknown) => Promise<unknown>) =>
      work({}),
    ),
  };
  const handler = new ProcessStripeWebhookHandler(
    webhookEventRepository as never,
    paymentOrderRepository as never,
    settlement as never,
    unitOfWork as never,
  );

  const event = (
    type = 'checkout.session.completed',
    session: SessionOverrides = {},
    livemode = false,
  ) =>
    ({
      id: 'evt_1',
      type,
      livemode,
      created: 1769835600,
      data: {
        object: {
          livemode: false,
          mode: 'payment',
          status: 'complete',
          payment_status: 'paid',
          payment_method_types: ['card'],
          payment_intent: 'pi_1',
          client_reference_id: 'order-1',
          amount_total: 99000,
          currency: 'vnd',
          metadata: {
            orderCode: ORDER_CODE,
            paymentOrderId: 'order-1',
            workspaceId: 'workspace-1',
          },
          ...session,
        },
      },
    }) as unknown as Stripe.Event;

  const run = (...args: Parameters<typeof event>) =>
    handler.execute(new ProcessStripeWebhookCommand(event(...args)));

  const savedStatus = () =>
    webhookEventRepository.save.mock.calls.at(-1)?.[0].getStatus();

  beforeEach(() => {
    jest.clearAllMocks();
    webhookEventRepository.insertIfAbsent.mockResolvedValue(true);
    settlement.settle.mockResolvedValue('PROCESSED');
    order = PaymentOrder.create({
      id: 'order-1',
      workspaceId: 'workspace-1',
      subscriptionId: 'subscription-1',
      planPriceId: 'price-1',
      provider: BillingProvider.STRIPE,
      orderCode: ORDER_CODE,
      amount: 99000,
      currency: 'VND',
      createdBy: 'actor',
      createdAt: new Date('2026-01-31T04:00:00Z'),
      expiresAt: new Date('2026-01-31T06:00:00Z'),
    });
  });

  it('settles a paid checkout session at the event time', async () => {
    await run();

    expect(settlement.settle).toHaveBeenCalledWith(
      expect.objectContaining({
        orderCode: ORDER_CODE,
        provider: BillingProvider.STRIPE,
        amount: 99000,
        paidAt: new Date(1769835600 * 1000),
      }),
    );
    expect(savedStatus()).toBe(BillingWebhookStatus.PROCESSED);
  });

  it('rejects live mode events before opening a transaction', async () => {
    await expect(
      run('checkout.session.completed', {}, true),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(unitOfWork.runInTransaction).not.toHaveBeenCalled();
  });

  it.each<[string, SessionOverrides]>([
    ['a session that is not paid yet', { payment_status: 'unpaid' }],
    ['a session without a payment intent', { payment_intent: null }],
    ['a session referencing another order', { client_reference_id: 'order-2' }],
    ['a session in another currency', { currency: 'usd' }],
  ])('ignores %s', async (_label, session) => {
    await run('checkout.session.completed', session);

    expect(settlement.settle).not.toHaveBeenCalled();
    expect(savedStatus()).toBe(BillingWebhookStatus.IGNORED);
  });

  it('ignores a session whose metadata points to another workspace', async () => {
    await run('checkout.session.completed', {
      metadata: {
        orderCode: ORDER_CODE,
        paymentOrderId: 'order-1',
        workspaceId: 'workspace-2',
      },
    });

    expect(settlement.settle).not.toHaveBeenCalled();
    expect(savedStatus()).toBe(BillingWebhookStatus.IGNORED);
  });

  it('records unrelated event types as ignored', async () => {
    await run('invoice.paid');

    expect(
      paymentOrderRepository.findByOrderCodeForUpdate,
    ).not.toHaveBeenCalled();
    expect(savedStatus()).toBe(BillingWebhookStatus.IGNORED);
  });

  it('keeps the event ignored when settlement ignores the payment', async () => {
    settlement.settle.mockResolvedValue('IGNORED');

    await run();

    expect(savedStatus()).toBe(BillingWebhookStatus.IGNORED);
  });
});
