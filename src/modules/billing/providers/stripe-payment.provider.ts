import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe = require('stripe');

import { PlanBillingInterval } from '../domain/entities/plan.entity';
import { BillingProvider } from '../domain/entities/subscription.entity';
import {
  CreateStripeCheckoutInput,
  StripePaymentProvider,
} from '../types/payment-input.interface';

@Injectable()
export class StripePaymentProviderImpl implements StripePaymentProvider {
  private readonly stripe: InstanceType<typeof Stripe>;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
  }

  async createCheckout(input: CreateStripeCheckoutInput) {
    const clientUrl =
      this.configService.get<string>('CLIENT_URL') ?? 'http://localhost:3000';
    const successUrl =
      this.configService.get<string>('STRIPE_SUCCESS_URL') ??
      `${clientUrl}/billing/payment-return?provider=stripe&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      this.configService.get<string>('STRIPE_CANCEL_URL') ??
      `${clientUrl}/billing`;
    const isRecurring =
      input.billingInterval !== PlanBillingInterval.LIFETIME;
    const metadata = {
      paymentId: input.paymentId,
      orderCode: input.orderCode,
      userId: input.userId,
      planId: input.planId,
      targetWorkspaceId: input.targetWorkspaceId ?? '',
    };

    const session = await this.stripe.checkout.sessions.create({
      mode: isRecurring ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amount,
            product_data: {
              name: input.planName,
            },
            ...(isRecurring
              ? {
                  recurring: {
                    interval:
                      input.billingInterval === PlanBillingInterval.YEAR
                        ? ('year' as const)
                        : ('month' as const),
                  },
                }
              : {}),
          },
        },
      ],
      client_reference_id: input.paymentId,
      metadata,
      ...(isRecurring
        ? { subscription_data: { metadata } }
        : { payment_intent_data: { metadata } }),
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      throw new Error('Stripe Checkout did not return a payment URL');
    }

    return {
      provider: BillingProvider.STRIPE,
      paymentUrl: session.url,
      providerOrderId: session.id,
      providerRequestId: null,
      providerTransactionId: null,
      rawResponse: {
        checkoutSessionId: session.id,
        paymentStatus: session.payment_status,
        status: session.status,
        expiresAt: new Date(session.expires_at * 1000).toISOString(),
      },
    };
  }
}
