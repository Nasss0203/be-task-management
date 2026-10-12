export const PAYMENT_TYPES = {
  providers: {
    SepayWebhookService: Symbol('SepayWebhookService'),
    SepayPgIpnAuthService: Symbol('SepayPgIpnAuthService'),
    SepayPgCheckoutService: Symbol('SepayPgCheckoutService'),
    StripeCheckoutService: Symbol('StripeCheckoutService'),
    StripeWebhookService: Symbol('StripeWebhookService'),
  },
} as const;
