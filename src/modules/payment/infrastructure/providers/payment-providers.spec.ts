import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import Stripe from 'stripe';

import { SepayPgCheckoutService } from './sepay/sepay-pg-checkout.service';
import { SepayPgIpnAuthService } from './sepay/sepay-pg-ipn-auth.service';
import { SepayWebhookService } from './sepay/sepay-webhook.service';
import { StripeCheckoutService } from './stripe/stripe-checkout.service';
import { StripeWebhookService } from './stripe/stripe-webhook.service';

// Synthetic credentials only; checkout HTTP calls are intercepted below.
const configValues = {
  STRIPE_SECRET_KEY: 'sk_test_local_refactor',
  STRIPE_WEBHOOK_SECRET: 'whsec_local_refactor',
  STRIPE_CHECKOUT_SUCCESS_URL:
    'https://example.test/result?session_id={CHECKOUT_SESSION_ID}',
  STRIPE_CHECKOUT_CANCEL_URL: 'https://example.test/result',
  SEPAY_PG_ENV: 'sandbox',
  SEPAY_PG_MERCHANT_ID: 'local-merchant',
  SEPAY_PG_SECRET_KEY: 'local-pg-secret',
  SEPAY_WEBHOOK_SECRET: 'local-webhook-secret',
  BILLING_FRONTEND_RESULT_URL: 'https://example.test/result',
};

describe('Payment gateway adapters', () => {
  const config = new ConfigService(configValues);
  const input = {
    paymentOrderId: 'order-1',
    workspaceId: 'workspace-1',
    orderCode: `TM${'A'.repeat(32)}`,
    amount: 99000,
    currency: 'VND',
    expiresAt: new Date('2026-10-12T05:00:00Z'),
  };

  afterEach(() => jest.restoreAllMocks());

  it('preserves Stripe checkout metadata, amount, expiry and idempotency key', async () => {
    const service = new StripeCheckoutService(config);
    const client = (service as unknown as { stripe: Stripe }).stripe;
    const create = jest
      .spyOn(client.checkout.sessions, 'create')
      .mockResolvedValue({
        url: 'https://example.test/checkout',
      } as Stripe.Response<Stripe.Checkout.Session>);

    expect(await service.createCheckout(input)).toEqual({
      checkoutUrl: 'https://example.test/checkout',
      checkoutMethod: 'GET',
      checkoutFields: {},
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        payment_method_types: ['card'],
        client_reference_id: input.paymentOrderId,
        metadata: {
          paymentOrderId: input.paymentOrderId,
          workspaceId: input.workspaceId,
          orderCode: input.orderCode,
        },
        expires_at: Math.floor(input.expiresAt.getTime() / 1000),
        success_url: expect.stringContaining('{CHECKOUT_SESSION_ID}'),
        cancel_url: expect.stringContaining('status=cancelled'),
        line_items: [
          expect.objectContaining({
            quantity: 1,
            price_data: expect.objectContaining({
              currency: 'vnd',
              unit_amount: input.amount,
              product_data: {
                name: 'TaskManly subscription',
                description: `TaskManly billing order ${input.orderCode}`,
              },
            }),
          }),
        ],
      }),
      { idempotencyKey: `billing-checkout-result-v2:${input.paymentOrderId}` },
    );
  });

  it('rejects a Stripe checkout without a URL', async () => {
    const service = new StripeCheckoutService(config);
    const client = (service as unknown as { stripe: Stripe }).stripe;
    jest
      .spyOn(client.checkout.sessions, 'create')
      .mockResolvedValue({
        url: null,
      } as Stripe.Response<Stripe.Checkout.Session>);
    await expect(service.createCheckout(input)).rejects.toThrow(
      'URL is unavailable',
    );
  });

  it.each([StripeCheckoutService, StripeWebhookService])(
    'rejects live Stripe credentials in %p',
    (Service) => {
      expect(
        () =>
          new Service(
            new ConfigService({
              ...configValues,
              STRIPE_SECRET_KEY: 'sk_live_local',
            }),
          ),
      ).toThrow();
    },
  );

  it.each(['sandbox', 'production'])(
    'preserves SePay %s configuration and signed field ordering',
    (environment) => {
      const service = new SepayPgCheckoutService(
        new ConfigService({ ...configValues, SEPAY_PG_ENV: environment }),
      );
      const result = service.createCheckout(input);
      expect(result.checkoutMethod).toBe('POST');
      expect(Object.keys(result.checkoutFields)).toEqual([
        'order_amount',
        'merchant',
        'currency',
        'operation',
        'order_description',
        'order_invoice_number',
        'payment_method',
        'success_url',
        'error_url',
        'cancel_url',
        'signature',
      ]);
      expect(result.checkoutFields).toMatchObject({
        order_amount: input.amount,
        merchant: 'local-merchant',
        currency: 'VND',
        operation: 'PURCHASE',
        order_invoice_number: input.orderCode,
        payment_method: 'BANK_TRANSFER',
        order_description: `TaskManly billing order ${input.orderCode}`,
      });
      expect(result.checkoutUrl).toContain(
        environment === 'sandbox' ? 'sandbox' : 'pay.sepay.vn',
      );
      for (const [field, status] of [
        ['success_url', 'success'],
        ['error_url', 'error'],
        ['cancel_url', 'cancelled'],
      ]) {
        const url = new URL(String(result.checkoutFields[field]));
        expect(url.searchParams.get('paymentOrderId')).toBe(
          input.paymentOrderId,
        );
        expect(url.searchParams.get('workspaceId')).toBe(input.workspaceId);
        expect(url.searchParams.get('status')).toBe(status);
      }
      expect(result.checkoutFields.signature).toEqual(expect.any(String));
    },
  );

  it('rejects invalid SePay environment configuration', () => {
    expect(
      () =>
        new SepayPgCheckoutService(
          new ConfigService({ ...configValues, SEPAY_PG_ENV: 'invalid' }),
        ),
    ).toThrow('sandbox or production');
  });

  it('verifies Stripe signatures against the exact raw body and rejects live events', () => {
    const service = new StripeWebhookService(config);
    const event = {
      id: 'evt_local',
      type: 'checkout.session.completed',
      livemode: false,
      data: { object: {} },
    };
    const rawBody = Buffer.from(JSON.stringify(event));
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: rawBody.toString(),
      secret: configValues.STRIPE_WEBHOOK_SECRET,
    });
    expect(service.verifyAndParse(rawBody, signature)).toEqual(event);
    expect(() =>
      service.verifyAndParse(Buffer.from(`${rawBody.toString()} `), signature),
    ).toThrow('Invalid Stripe webhook signature');
    expect(() => service.verifyAndParse(rawBody)).toThrow(
      'Missing Stripe webhook signature',
    );
    const liveBody = JSON.stringify({ ...event, livemode: true });
    const liveSignature = Stripe.webhooks.generateTestHeaderString({
      payload: liveBody,
      secret: configValues.STRIPE_WEBHOOK_SECRET,
    });
    expect(() =>
      service.verifyAndParse(Buffer.from(liveBody), liveSignature),
    ).toThrow('Live Stripe webhook');
  });

  it('verifies SePay raw body HMAC, timestamp window and missing headers', () => {
    const service = new SepayWebhookService(config);
    const rawBody = Buffer.from('{"id":1}');
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = `sha256=${createHmac('sha256', configValues.SEPAY_WEBHOOK_SECRET).update(`${timestamp}.`).update(rawBody).digest('hex')}`;
    expect(() =>
      service.verifySignature({ rawBody, timestamp, signature }),
    ).not.toThrow();
    expect(() =>
      service.verifySignature({
        rawBody: Buffer.from('{"id":2}'),
        timestamp,
        signature,
      }),
    ).toThrow('Invalid SePay webhook signature');
    expect(() =>
      service.verifySignature({
        rawBody,
        timestamp: String(Number(timestamp) - 301),
        signature,
      }),
    ).toThrow('expired');
    expect(() =>
      service.verifySignature({ rawBody, timestamp, signature: undefined }),
    ).toThrow('Missing SePay webhook signature');
  });

  it('authenticates SePay IPN and limits unsigned test acknowledgements to sandbox', () => {
    const service = new SepayPgIpnAuthService(config);
    expect(service.verify(configValues.SEPAY_PG_SECRET_KEY)).toBe(
      'AUTHENTICATED',
    );
    expect(() => service.verify('wrong')).toThrow(
      'Invalid SePay PG IPN secret',
    );
    const payload = {
      notification_type: 'PAYMENT_SUCCESS',
      order: {
        order_id: 'TEST_ORDER_1',
        custom_data: { test_mode: true, webhook_test: true },
      },
      transaction: { transaction_id: 'TEST_TXN_1' },
    };
    expect(service.verify(undefined, payload)).toBe('SANDBOX_TEST');
    expect(() => service.verify(undefined, {})).toThrow(
      'Missing SePay PG IPN secret',
    );
    const production = new SepayPgIpnAuthService(
      new ConfigService({ ...configValues, SEPAY_PG_ENV: 'production' }),
    );
    expect(() => production.verify(undefined, payload)).toThrow(
      'Missing SePay PG IPN secret',
    );
  });
});
