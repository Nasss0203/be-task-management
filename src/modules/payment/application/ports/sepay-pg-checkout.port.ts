export type SepayPgCheckoutFieldValue = string | number;

export interface CreateSepayPgCheckoutInput {
  paymentOrderId: string;
  workspaceId: string;
  orderCode: string;
  amount: number;
  currency: string;
}

export interface SepayPgCheckoutResult {
  checkoutUrl: string;
  checkoutMethod: 'POST';
  checkoutFields: Record<string, SepayPgCheckoutFieldValue>;
}

export interface SepayPgCheckoutPort {
  createCheckout(input: CreateSepayPgCheckoutInput): SepayPgCheckoutResult;
}
