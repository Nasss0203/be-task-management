import { BillingProvider } from '../../../domain/constants/billing-provider.constant';
import { PaymentOrderStatus } from '../../../domain/constants/payment-order-status.constant';

export class CreateBillingCheckoutResponseDto {
  paymentOrderId: string;
  workspaceId: string;
  planPriceId: string;
  orderCode: string;
  amount: number;
  currency: string;
  provider: BillingProvider;
  status: PaymentOrderStatus;
  expiresAt: Date;

  checkoutUrl: string;
  checkoutMethod: 'GET' | 'POST';
  checkoutFields: Record<string, string | number>;
}
