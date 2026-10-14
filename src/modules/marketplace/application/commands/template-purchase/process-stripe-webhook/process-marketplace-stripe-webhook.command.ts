import type Stripe from 'stripe';

export class ProcessMarketplaceStripeWebhookCommand {
  constructor(public readonly event: Stripe.Event) {}
}
