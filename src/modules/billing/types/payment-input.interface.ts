import { type ReturnQueryFromVNPay } from 'vnpay';
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
  providerRequestId: string | null;
  providerTransactionId: string | null;
  rawResponse: Record<string, unknown>;
}

export interface VnpayVerifyResult {
  isVerified: boolean;
  isSuccess: boolean;
  message?: string;

  vnp_Amount?: number | string;
  vnp_TxnRef?: string;
  vnp_ResponseCode?: string | number;
  vnp_TransactionStatus?: string | number;
  vnp_TransactionNo?: string;
  vnp_BankCode?: string;
  vnp_PayDate?: string;
}

export interface VnpayPaymentProvider {
  createPayment(input: CreateGatewayPaymentInput): CreateGatewayPaymentResult;

  verifyReturnUrl(query: ReturnQueryFromVNPay): Promise<VnpayVerifyResult>;

  verifyIpn(query: ReturnQueryFromVNPay): Promise<VnpayVerifyResult>;
}
