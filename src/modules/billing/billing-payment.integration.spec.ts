import {
  Global,
  INestApplication,
  Module,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import Stripe from 'stripe';
import { createHmac } from 'node:crypto';

import { DatabaseModule } from 'src/database/database.module';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { PaymentModule } from '../payment/payment.module';
import { PAYMENT_TYPES } from '../payment/payment.types';
import { StripeCheckoutService } from '../payment/infrastructure/providers/stripe/stripe-checkout.service';
import { StripeWebhookService } from '../payment/infrastructure/providers/stripe/stripe-webhook.service';
import { SepayPgCheckoutService } from '../payment/infrastructure/providers/sepay/sepay-pg-checkout.service';
import { SepayPgIpnAuthService } from '../payment/infrastructure/providers/sepay/sepay-pg-ipn-auth.service';
import { SepayWebhookService } from '../payment/infrastructure/providers/sepay/sepay-webhook.service';
import { BillingModule } from './billing.module';
import { BILLING_TYPES } from './billing.types';
import { BillingProvider } from './domain/constants/billing-provider.constant';
import { BillingInterval } from './domain/constants/billing-interval.constant';
import { PaymentOrderStatus } from './domain/constants/payment-order-status.constant';
import { BillingWebhookStatus } from './domain/constants/billing-webhook-status.constant';
import { BillingPlan } from './domain/entities/billing-plan.entity';
import { BillingPlanPrice } from './domain/entities/billing-plan-price.entity';
import { PaymentOrder } from './domain/entities/payment-order.entity';
import { WorkspaceSubscription } from './domain/entities/workspace-subscription.entity';
import { CreateBillingCheckoutCommand } from './application/commands/checkout/create-billing-checkout/create-billing-checkout.command';
import { CreateBillingCheckoutHandler } from './application/commands/checkout/create-billing-checkout/create-billing-checkout.handler';
import { BillingPaymentSettlementService } from './application/services/billing-payment-settlement.service';
import { GetBillingPaymentStatusHandler } from './application/queries/payment/get-billing-payment-status/get-billing-payment-status.handler';
import { GetBillingPaymentStatusQuery } from './application/queries/payment/get-billing-payment-status/get-billing-payment-status.query';

const context = { syntheticTransaction: true };
const unitOfWork = { runInTransaction: jest.fn(async (fn) => fn(context)) };

// No database connection, environment file or gateway HTTP request is used.
@Global()
@Module({
  providers: [
    {
      provide: DataSource,
      useValue: {
        options: { type: 'postgres' },
        entityMetadatas: [],
        getRepository: () => ({}),
      },
    },
    { provide: PERSISTENCE_TYPES.UnitOfWork, useValue: unitOfWork },
  ],
  exports: [DataSource, PERSISTENCE_TYPES.UnitOfWork],
})
class SyntheticDatabaseModule {}

const configuration = {
  STRIPE_SECRET_KEY: 'sk_test_local_refactor',
  STRIPE_WEBHOOK_SECRET: 'whsec_local_refactor',
  STRIPE_CHECKOUT_SUCCESS_URL: 'https://example.test/result',
  STRIPE_CHECKOUT_CANCEL_URL: 'https://example.test/result',
  SEPAY_PG_ENV: 'sandbox',
  SEPAY_PG_MERCHANT_ID: 'local-merchant',
  SEPAY_PG_SECRET_KEY: 'local-pg-secret',
  SEPAY_WEBHOOK_SECRET: 'local-webhook-secret',
  BILLING_FRONTEND_RESULT_URL: 'https://example.test/result',
};

function createBuilder() {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        ignoreEnvVars: true,
        load: [() => configuration],
      }),
      BillingModule,
    ],
  })
    .overrideModule(DatabaseModule)
    .useModule(SyntheticDatabaseModule);
}

describe('Billing → Payment dependency injection', () => {
  it('initializes the real module graph with all repository and gateway providers', async () => {
    const module = await createBuilder().compile();
    const app = module.createNestApplication({ rawBody: true });
    try {
      await app.init();
      for (const token of Object.values(BILLING_TYPES.repositories)) {
        expect(
          module.select(BillingModule).get(token, { strict: true }),
        ).toBeDefined();
      }
      const services = {
        SepayWebhookService,
        SepayPgIpnAuthService,
        SepayPgCheckoutService,
        StripeCheckoutService,
        StripeWebhookService,
      };
      for (const [name, token] of Object.entries(PAYMENT_TYPES.providers)) {
        expect(
          module.select(PaymentModule).get(token, { strict: true }),
        ).toBeInstanceOf(services[name]);
        expect(() =>
          module.select(BillingModule).get(token, { strict: true }),
        ).toThrow();
      }
      expect(
        module.get(BILLING_TYPES.applications.CreateBillingCheckoutHandler),
      ).toBeInstanceOf(CreateBillingCheckoutHandler);
    } finally {
      await app.close();
    }
  });
});

describe('Subscription checkout and verified webhook settlement (synthetic persistence)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let order: PaymentOrder | null;
  let subscription: WorkspaceSubscription;
  let planPrice: BillingPlanPrice;
  const workspaceId = '11111111-1111-4111-8111-111111111111';
  const planPriceId = '22222222-2222-4222-8222-222222222222';
  const paidAt = new Date('2026-01-31T05:00:00Z');
  const events = new Map<string, BillingWebhookStatus>();
  const orderRepository = {
    findById: jest.fn(async () => order),
    findUnexpiredPendingByWorkspaceIdAndPlanPriceId: jest.fn(async () => order),
    findByOrderCodeForUpdate: jest.fn(async (code) =>
      order?.getOrderCode() === code ? order : null,
    ),
    save: jest.fn(async (value: PaymentOrder) => {
      order = value;
      return value;
    }),
  };
  const subscriptionRepository = {
    findById: jest.fn(async () => subscription),
    findByWorkspaceId: jest.fn(async () => subscription),
    save: jest.fn(async (value) => value),
  };
  const priceRepository = {
    findActiveById: jest.fn(async () => planPrice),
    findById: jest.fn(async () => planPrice),
    findActiveByPlanIds: jest.fn(async () => [planPrice]),
  };
  const eventRepository = {
    insertIfAbsent: jest.fn(async (event) => {
      const key = `${event.getProvider()}:${event.getProviderEventId()}`;
      if (events.has(key)) return false;
      events.set(key, event.getStatus());
      return true;
    }),
    save: jest.fn(async (event) => {
      events.set(
        `${event.getProvider()}:${event.getProviderEventId()}`,
        event.getStatus(),
      );
      return event;
    }),
  };

  function resetOrder(provider = BillingProvider.STRIPE) {
    planPrice = BillingPlanPrice.create({
      id: planPriceId,
      planId: 'plan-paid',
      provider,
      billingInterval: BillingInterval.MONTHLY,
      currency: 'VND',
      amount: 99000,
    });
    order = PaymentOrder.create({
      id: '33333333-3333-4333-8333-333333333333',
      workspaceId,
      subscriptionId: subscription.getId(),
      planPriceId,
      provider,
      orderCode: `TM${'A'.repeat(32)}`,
      amount: 99000,
      currency: 'VND',
      createdBy: 'actor',
      createdAt: new Date('2026-01-31T04:00:00Z'),
      expiresAt: new Date('2026-01-31T06:00:00Z'),
    });
  }

  function stripePayload(
    type = 'checkout.session.completed',
    amount = 99000,
    eventId = 'evt_local',
  ) {
    return {
      id: eventId,
      type,
      livemode: false,
      created: Math.floor(paidAt.getTime() / 1000),
      data: {
        object: {
          livemode: false,
          mode: 'payment',
          status: type.endsWith('expired') ? 'expired' : 'complete',
          payment_status: type.endsWith('expired') ? 'unpaid' : 'paid',
          payment_method_types: ['card'],
          payment_intent: 'pi_local',
          client_reference_id: order!.getId(),
          amount_total: amount,
          currency: 'vnd',
          metadata: {
            orderCode: order!.getOrderCode(),
            paymentOrderId: order!.getId(),
            workspaceId,
          },
        },
      },
    };
  }

  async function sendStripe(payload: ReturnType<typeof stripePayload>) {
    const body = JSON.stringify(payload);
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: body,
      secret: configuration.STRIPE_WEBHOOK_SECRET,
    });
    return request(app.getHttpServer())
      .post('/api/v1/billing/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(body);
  }

  beforeAll(async () => {
    const freePlan = BillingPlan.create({
      id: 'plan-free',
      code: 'FREE',
      name: 'Free',
    });
    module = await createBuilder()
      .overrideProvider(BILLING_TYPES.repositories.PaymentOrderRepository)
      .useValue(orderRepository)
      .overrideProvider(
        BILLING_TYPES.repositories.WorkspaceSubscriptionRepository,
      )
      .useValue(subscriptionRepository)
      .overrideProvider(BILLING_TYPES.repositories.BillingPlanPriceRepository)
      .useValue(priceRepository)
      .overrideProvider(
        BILLING_TYPES.repositories.BillingWebhookEventRepository,
      )
      .useValue(eventRepository)
      .overrideProvider(BILLING_TYPES.repositories.BillingPlanRepository)
      .useValue({
        findByCode: async () => freePlan,
        findById: async () => freePlan,
        findActivePublic: async () => [freePlan],
      })
      .overrideProvider(BILLING_TYPES.repositories.BillingFeatureRepository)
      .useValue({ findAll: async () => [] })
      .overrideProvider(BILLING_TYPES.repositories.BillingPlanFeatureRepository)
      .useValue({ findByPlanIds: async () => [] })
      .compile();
    const checkout = module.get<StripeCheckoutService>(
      PAYMENT_TYPES.providers.StripeCheckoutService,
    );
    const client = (checkout as unknown as { stripe: Stripe }).stripe;
    jest
      .spyOn(client.checkout.sessions, 'create')
      .mockResolvedValue({
        url: 'https://example.test/checkout',
      } as Stripe.Response<Stripe.Checkout.Session>);
    app = module.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    events.clear();
    subscription = WorkspaceSubscription.createInitialFree({
      id: 'subscription',
      workspaceId,
      planId: 'plan-free',
    });
    resetOrder();
  });

  afterAll(async () => {
    await app?.close();
    jest.restoreAllMocks();
  });

  it.each([BillingProvider.STRIPE, BillingProvider.SEPAY])(
    'creates and sequentially reuses one %s checkout order through exported Payment adapters',
    async (provider) => {
      resetOrder(provider);
      order = null;
      const handler = module.get<CreateBillingCheckoutHandler>(
        BILLING_TYPES.applications.CreateBillingCheckoutHandler,
      );
      const command = new CreateBillingCheckoutCommand(
        workspaceId,
        planPriceId,
        'actor',
      );
      const first = await handler.execute(command);
      const second = await handler.execute(command);
      expect(first).toMatchObject({
        workspaceId,
        planPriceId,
        amount: 99000,
        currency: 'VND',
        provider,
        status: 'PENDING',
        checkoutMethod: provider === BillingProvider.STRIPE ? 'GET' : 'POST',
      });
      expect(second.paymentOrderId).toBe(first.paymentOrderId);
      expect(orderRepository.save).toHaveBeenCalledTimes(1);
      expect(order!.getSubscriptionId()).toBe(subscription.getId());
      expect(unitOfWork.runInTransaction).not.toHaveBeenCalled();
    },
  );

  it('keeps plan, subscription and payment-status HTTP response contracts', async () => {
    const plans = await request(app.getHttpServer())
      .get('/api/v1/billing/plans')
      .expect(200);
    expect(plans.body.items[0]).toMatchObject({
      code: 'FREE',
      features: [],
      prices: [],
    });
    const response = await request(app.getHttpServer())
      .get(`/api/v1/billing/workspaces/${workspaceId}/subscription`)
      .expect(200);
    expect(response.body).toMatchObject({
      workspaceId,
      plan: { code: 'FREE' },
      planPriceId: null,
    });
    const status = await request(app.getHttpServer())
      .post('/api/v1/billing/payment-status')
      .send({ workspaceId, paymentOrderId: order!.getId() })
      .expect(200);
    expect(status.body).toMatchObject({
      workspaceId,
      planPriceId,
      provider: 'STRIPE',
      status: 'PENDING',
      amount: 99000,
    });
  });

  it('does not expose orders belonging to another workspace', async () => {
    const handler = module.get<GetBillingPaymentStatusHandler>(
      BILLING_TYPES.applications.GetBillingPaymentStatusHandler,
    );
    await expect(
      handler.execute(
        new GetBillingPaymentStatusQuery('other-workspace', order!.getId()),
      ),
    ).rejects.toThrow('Payment order not found');
  });

  it('settles a raw signed Stripe webhook once and activates a month-end subscription', async () => {
    const payload = stripePayload();
    expect((await sendStripe(payload)).body).toEqual({ received: true });
    expect((await sendStripe(payload)).body).toEqual({ received: true });
    expect(order!.getStatus()).toBe(PaymentOrderStatus.PAID);
    expect(subscription.getPlanId()).toBe('plan-paid');
    expect(subscription.getCurrentPeriodEnd()).toEqual(
      new Date('2026-02-28T05:00:00Z'),
    );
    expect(subscriptionRepository.save).toHaveBeenCalledTimes(1);
    expect(orderRepository.findByOrderCodeForUpdate).toHaveBeenCalledWith(
      order!.getOrderCode(),
      context,
    );
    expect(events.get('STRIPE:evt_local')).toBe(BillingWebhookStatus.PROCESSED);
  });

  it('does not activate again for a different Stripe event referencing an already paid order', async () => {
    await sendStripe(stripePayload());
    await sendStripe(
      stripePayload('checkout.session.completed', 99000, 'evt_second'),
    );
    expect(subscriptionRepository.save).toHaveBeenCalledTimes(1);
    expect(events.get('STRIPE:evt_second')).toBe(BillingWebhookStatus.IGNORED);
  });

  it('ignores a signed Stripe event with a mismatched amount', async () => {
    expect(
      (await sendStripe(stripePayload('checkout.session.completed', 1))).status,
    ).toBe(200);
    expect(order!.isPending()).toBe(true);
    expect(subscriptionRepository.save).not.toHaveBeenCalled();
  });

  it('preserves Stripe expiration handling', async () => {
    expect(
      (await sendStripe(stripePayload('checkout.session.expired'))).status,
    ).toBe(200);
    expect(order!.getStatus()).toBe(PaymentOrderStatus.EXPIRED);
    expect(subscriptionRepository.save).not.toHaveBeenCalled();
  });

  it('rejects invalid Stripe signatures before opening a settlement transaction', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/billing/webhooks/stripe')
      .set('stripe-signature', 'invalid')
      .send(stripePayload())
      .expect(400);
    expect(unitOfWork.runInTransaction).not.toHaveBeenCalled();
    expect(eventRepository.insertIfAbsent).not.toHaveBeenCalled();
  });

  it('settles a signed SePay bank webhook once with the same acknowledgement', async () => {
    resetOrder(BillingProvider.SEPAY);
    const payload = {
      id: 1,
      gateway: 'test',
      transactionDate: '2026-01-31 12:00:00',
      accountNumber: 'local',
      content: order!.getOrderCode(),
      transferType: 'in',
      transferAmount: 99000,
      accumulated: 99000,
      referenceCode: 'local',
    };
    const body = JSON.stringify(payload);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = `sha256=${createHmac('sha256', configuration.SEPAY_WEBHOOK_SECRET).update(`${timestamp}.`).update(body).digest('hex')}`;
    for (let i = 0; i < 2; i++) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/webhooks/sepay')
        .set('Content-Type', 'application/json')
        .set('x-sepay-signature', signature)
        .set('x-sepay-timestamp', timestamp)
        .send(body)
        .expect(200);
      expect(response.body).toEqual({ success: true });
    }
    expect(order!.getStatus()).toBe(PaymentOrderStatus.PAID);
    expect(subscriptionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('settles authenticated SePay PG IPN once and rejects invalid secrets', async () => {
    resetOrder(BillingProvider.SEPAY);
    const payload = {
      timestamp: Math.floor(Date.now() / 1000),
      notification_type: 'ORDER_PAID',
      order: {
        order_invoice_number: order!.getOrderCode(),
        order_status: 'CAPTURED',
        order_currency: 'VND',
        order_amount: '99000',
      },
      transaction: {
        id: 'txn_local',
        payment_method: 'BANK_TRANSFER',
        transaction_type: 'PAYMENT',
        transaction_status: 'APPROVED',
        transaction_currency: 'VND',
        transaction_amount: '99000.00',
        transaction_date: '2026-01-31 12:00:00',
      },
    };
    await request(app.getHttpServer())
      .post('/api/v1/billing/webhooks/sepay/ipn')
      .set('x-secret-key', 'invalid')
      .send(payload)
      .expect(401);
    expect(unitOfWork.runInTransaction).not.toHaveBeenCalled();
    for (let i = 0; i < 2; i++) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/webhooks/sepay/ipn')
        .set('x-secret-key', configuration.SEPAY_PG_SECRET_KEY)
        .send(payload)
        .expect(200);
      expect(response.body).toEqual({ success: true });
    }
    expect(order!.getStatus()).toBe(PaymentOrderStatus.PAID);
    expect(subscriptionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('acknowledges unsigned sandbox IPN test payloads without settlement', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/billing/webhooks/sepay/ipn')
      .send({
        timestamp: Math.floor(Date.now() / 1000),
        notification_type: 'PAYMENT_SUCCESS',
        order: {
          order_id: 'TEST_ORDER_1',
          custom_data: { test_mode: true, webhook_test: true },
        },
        transaction: { transaction_id: 'TEST_TXN_1' },
      })
      .expect(200);
    expect(response.body).toEqual({ success: true });
    expect(unitOfWork.runInTransaction).not.toHaveBeenCalled();
  });

  it.each([
    { amount: 1 },
    { currency: 'USD' },
    { provider: BillingProvider.SEPAY },
  ])('preserves settlement validation for %p', async (mismatch) => {
    const settlement = module.get<BillingPaymentSettlementService>(
      BILLING_TYPES.services.BillingPaymentSettlementService,
    );
    expect(
      await settlement.settle({
        orderCode: order!.getOrderCode(),
        provider: BillingProvider.STRIPE,
        amount: 99000,
        currency: 'VND',
        paidAt,
        processedAt: paidAt,
        context,
        ...mismatch,
      }),
    ).toBe('IGNORED');
    expect(subscriptionRepository.save).not.toHaveBeenCalled();
    expect(order!.isPending()).toBe(true);
  });

  it('does not activate a subscription for payment at order expiry', async () => {
    const settlement = module.get<BillingPaymentSettlementService>(
      BILLING_TYPES.services.BillingPaymentSettlementService,
    );
    expect(
      await settlement.settle({
        orderCode: order!.getOrderCode(),
        provider: BillingProvider.STRIPE,
        amount: 99000,
        currency: 'VND',
        paidAt: order!.getExpiresAt()!,
        processedAt: paidAt,
        context,
      }),
    ).toBe('IGNORED');
    expect(order!.getStatus()).toBe(PaymentOrderStatus.EXPIRED);
    expect(subscriptionRepository.save).not.toHaveBeenCalled();
  });
});
