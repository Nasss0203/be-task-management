import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import type {
  CreateStripeCheckoutInput,
  StripeCheckoutPort,
  StripeCheckoutResult,
} from '../../../application/ports/stripe-checkout.port';

@Injectable()
export class StripeCheckoutService implements StripeCheckoutPort {
  private readonly stripe: Stripe;
  private readonly successUrl: string;
  private readonly cancelUrl: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.getRequiredConfig('STRIPE_SECRET_KEY');

    if (!secretKey.startsWith('sk_test_')) {
      throw new Error('Only Stripe test mode is allowed for this integration');
    }

    this.stripe = new Stripe(secretKey);

    this.successUrl = this.getRequiredConfig('STRIPE_CHECKOUT_SUCCESS_URL');

    this.cancelUrl = this.getRequiredConfig('STRIPE_CHECKOUT_CANCEL_URL');
  }

  async createCheckout(
    input: CreateStripeCheckoutInput,
  ): Promise<StripeCheckoutResult> {
    const metadata = {
      paymentOrderId: input.paymentOrderId,
      workspaceId: input.workspaceId,
      orderCode: input.orderCode,
    };

    const session = await this.stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],

        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency.toLowerCase(),
              unit_amount: input.amount,
              product_data: {
                name: 'TaskManly subscription',
                description: `TaskManly billing order ${input.orderCode}`,
              },
            },
          },
        ],

        client_reference_id: input.paymentOrderId,
        metadata,

        payment_intent_data: {
          metadata,
        },

        success_url: this.buildResultUrl(this.successUrl, input, 'success'),

        cancel_url: this.buildResultUrl(this.cancelUrl, input, 'cancelled'),

        expires_at: Math.floor(input.expiresAt.getTime() / 1000),
      },
      {
        idempotencyKey: `billing-checkout-result-v2:${input.paymentOrderId}`,
      },
    );

    if (!session.url) {
      throw new Error('Stripe Checkout Session URL is unavailable');
    }

    return {
      checkoutUrl: session.url,
      checkoutMethod: 'GET',
      checkoutFields: {},
    };
  }

  private buildResultUrl(
    baseUrl: string,
    input: CreateStripeCheckoutInput,
    status: 'success' | 'cancelled',
  ): string {
    const url = new URL(baseUrl);

    url.searchParams.set('paymentOrderId', input.paymentOrderId);
    url.searchParams.set('workspaceId', input.workspaceId);
    url.searchParams.set('status', status);

    
    return url
      .toString()
      .replace(/%7BCHECKOUT_SESSION_ID%7D/gi, '{CHECKOUT_SESSION_ID}');
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      throw new Error(`${key} is not configured`);
    }

    return value;
  }
}
