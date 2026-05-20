import { BillingWebhookStatus } from '../../domain/entities/billing-webhook.entity';
import { PaymentStatus } from '../../domain/entities/payment.entity';
import {
  BillingProvider,
  SubscriptionStatus,
} from '../../domain/entities/subscription.entity';

export class BillingWebhookResponseDto {
  id: string;
  userId: string | null;
  targetWorkspaceId: string | null;
  subscriptionId: string | null;
  paymentId: string | null;
  invoiceId: string | null;
  provider: BillingProvider;
  providerEventId: string;
  eventType: string;
  orderCode: string | null;
  providerTransactionId: string | null;
  status: BillingWebhookStatus;
  payload: Record<string, unknown>;
  processedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;

  userEmail: string | null;
  username: string | null;
  targetWorkspaceName: string | null;
  targetWorkspaceSlug: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  paymentStatus: PaymentStatus | null;
  invoiceNumber: string | null;
}
