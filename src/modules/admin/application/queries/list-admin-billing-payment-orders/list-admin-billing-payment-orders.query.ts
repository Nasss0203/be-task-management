import type { BillingProvider } from 'src/modules/billing/domain/constants/billing-provider.constant';
import type { PaymentOrderStatus } from 'src/modules/billing/domain/constants/payment-order-status.constant';

export class ListAdminBillingPaymentOrdersQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly status?: PaymentOrderStatus,
    public readonly provider?: BillingProvider,
    public readonly planCode?: string,
  ) {}
}
