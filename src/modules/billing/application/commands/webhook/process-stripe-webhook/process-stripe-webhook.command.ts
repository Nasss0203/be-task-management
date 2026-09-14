import type Stripe from 'stripe';

export class ProcessStripeWebhookCommand {
  constructor(public readonly event: Stripe.Event) {}
}
