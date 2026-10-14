import { Module } from '@nestjs/common';

import { BillingModule } from '../billing/billing.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { PaymentModule } from '../payment/payment.module';

import { StripeWebhookRouter } from './stripe-webhook-router.service';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [PaymentModule, BillingModule, MarketplaceModule],
  controllers: [StripeWebhookController],
  providers: [StripeWebhookRouter],
})
export class StripeWebhookModule {}
