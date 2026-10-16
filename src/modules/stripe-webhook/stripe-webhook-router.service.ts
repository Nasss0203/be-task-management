import { Inject, Injectable, Logger } from '@nestjs/common';
import type Stripe from 'stripe';

import { BILLING_TYPES } from '../billing/billing.types';
import { MARKETPLACE_TYPES } from '../marketplace/marketplace.types';

import { ProcessStripeWebhookCommand } from '../billing/application/commands/webhook/process-stripe-webhook/process-stripe-webhook.command';
import { ProcessStripeWebhookHandler } from '../billing/application/commands/webhook/process-stripe-webhook/process-stripe-webhook.handler';

import { ProcessMarketplaceStripeWebhookCommand } from '../marketplace/application/commands/template-purchase/process-stripe-webhook/process-marketplace-stripe-webhook.command';
import { ProcessMarketplaceStripeWebhookHandler } from '../marketplace/application/commands/template-purchase/process-stripe-webhook/process-marketplace-stripe-webhook.handler';

@Injectable()
export class StripeWebhookRouter {
  private readonly logger = new Logger(StripeWebhookRouter.name);

  constructor(
    @Inject(BILLING_TYPES.applications.ProcessStripeWebhookHandler)
    private readonly billingHandler: ProcessStripeWebhookHandler,

    @Inject(
      MARKETPLACE_TYPES.applications.ProcessMarketplaceStripeWebhookHandler,
    )
    private readonly marketplaceHandler: ProcessMarketplaceStripeWebhookHandler,
  ) {}

  async dispatch(event: Stripe.Event): Promise<void> {
    // Chỉ định tuyến các sự kiện Stripe Checkout được hỗ trợ.
    if (
      event.type !== 'checkout.session.completed' &&
      event.type !== 'checkout.session.expired'
    ) {
      this.logger.warn(
        `Ignored unsupported Stripe event type. EventId: ${event.id}, Type: ${event.type}`,
      );
      return;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    // 1. MARKETPLACE — Purchase Template
    if (metadata?.purpose === 'MARKETPLACE_TEMPLATE_PURCHASE') {
      await this.marketplaceHandler.execute(
        new ProcessMarketplaceStripeWebhookCommand(event),
      );
      return;
    }

    // 2. BILLING — Upgrade Workspace
    const isBilling =
      !metadata?.purpose &&
      /^TM[A-F0-9]{32}$/.test(metadata?.orderCode ?? '') &&
      Boolean(metadata?.paymentOrderId) &&
      Boolean(metadata?.workspaceId);

    if (isBilling) {
      await this.billingHandler.execute(new ProcessStripeWebhookCommand(event));
      return;
    }

    // 3. Unknown payment purpose / Unroutable event
    const isSuccessfulPayment =
      session.payment_status === 'paid' || session.status === 'complete';

    if (isSuccessfulPayment) {
      this.logger.error(
        `CRITICAL: Unroutable paid Stripe checkout session. EventId: ${event.id}, SessionId: ${session.id}, OrderCode: ${metadata?.orderCode ?? 'none'}, Purpose: ${metadata?.purpose ?? 'none'}`,
      );
    } else {
      this.logger.warn(
        `Unroutable Stripe checkout event. EventId: ${event.id}, Type: ${event.type}, OrderCode: ${metadata?.orderCode ?? 'none'}`,
      );
    }
  }
}
