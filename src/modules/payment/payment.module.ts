import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SepayPgCheckoutService } from './infrastructure/providers/sepay/sepay-pg-checkout.service';
import { SepayPgIpnAuthService } from './infrastructure/providers/sepay/sepay-pg-ipn-auth.service';
import { SepayWebhookService } from './infrastructure/providers/sepay/sepay-webhook.service';
import { StripeCheckoutService } from './infrastructure/providers/stripe/stripe-checkout.service';
import { StripeWebhookService } from './infrastructure/providers/stripe/stripe-webhook.service';
import { PAYMENT_TYPES } from './payment.types';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PAYMENT_TYPES.providers.SepayWebhookService,
      useClass: SepayWebhookService,
    },
    {
      provide: PAYMENT_TYPES.providers.SepayPgIpnAuthService,
      useClass: SepayPgIpnAuthService,
    },
    {
      provide: PAYMENT_TYPES.providers.SepayPgCheckoutService,
      useClass: SepayPgCheckoutService,
    },
    {
      provide: PAYMENT_TYPES.providers.StripeCheckoutService,
      useClass: StripeCheckoutService,
    },
    {
      provide: PAYMENT_TYPES.providers.StripeWebhookService,
      useClass: StripeWebhookService,
    },
  ],
  exports: [
    PAYMENT_TYPES.providers.SepayWebhookService,
    PAYMENT_TYPES.providers.SepayPgIpnAuthService,
    PAYMENT_TYPES.providers.SepayPgCheckoutService,
    PAYMENT_TYPES.providers.StripeCheckoutService,
    PAYMENT_TYPES.providers.StripeWebhookService,
  ],
})
export class PaymentModule {}
