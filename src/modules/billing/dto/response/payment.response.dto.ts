import {
  PaymentMethod,
  PaymentStatus,
} from '../../domain/entities/payment.entity';
import {
  BillingProvider,
  SubscriptionStatus,
} from '../../domain/entities/subscription.entity';

export class PaymentResponseDto {
  id: string;
  userId: string;
  planId: string;
  targetWorkspaceId: string | null;
  subscriptionId: string | null;
  invoiceId: string | null;
  orderCode: string;
  provider: BillingProvider;
  providerPaymentId: string | null;
  providerOrderId: string | null;
  providerRequestId: string | null;
  providerTransactionId: string | null;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentUrl: string | null;
  expiredAt: Date | null;
  paidAt: Date | null;
  failedReason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;

  userEmail: string | null;
  username: string | null;
  planName: string | null;
  planSlug: string | null;
  targetWorkspaceName: string | null;
  targetWorkspaceSlug: string | null;
  invoiceNumber: string | null;
  subscriptionStatus: SubscriptionStatus | null;
}
