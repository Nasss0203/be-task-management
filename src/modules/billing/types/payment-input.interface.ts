import { BillingProvider } from '../domain/entities/subscription.entity';

export interface CreateGatewayPaymentInput {
  orderCode: string;
  amount: number;
  orderInfo: string;
  ipAddress?: string;
  extraData?: string;
}

export interface CreateGatewayPaymentResult {
  provider: BillingProvider;
  paymentUrl: string;
  providerOrderId: string;
  providerRequestId?: string | null;
  providerTransactionId?: string | null;
  rawResponse: Record<string, unknown>;
}

export interface VnpayPaymentProvider {
  createPayment(
    input: CreateGatewayPaymentInput,
  ): Promise<CreateGatewayPaymentResult>;
}
