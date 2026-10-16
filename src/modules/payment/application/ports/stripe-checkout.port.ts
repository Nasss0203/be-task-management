export interface CreateStripeCheckoutInput {
  paymentOrderId: string;
  workspaceId: string;
  orderCode: string;
  amount: number;
  currency: string;
  expiresAt: Date;
}

export interface StripeCheckoutResult {
  checkoutUrl: string;
  checkoutMethod: 'GET';
  checkoutFields: Record<string, never>;
}

export interface CreateMarketplaceStripeCheckoutInput {
  purchaseId: string;
  templateId: string;
  orderCode: string;
  amount: number;
  currency: 'VND';
  expiresAt: Date;
}

export interface StripeCheckoutPort {
  createCheckout(
    input: CreateStripeCheckoutInput,
  ): Promise<StripeCheckoutResult>;

  createMarketplaceCheckout(
    input: CreateMarketplaceStripeCheckoutInput,
  ): Promise<StripeCheckoutResult>;
}
