import { BillingWebhookStatus } from '../entities/billing-webhook.entity';
import { PaymentStatus } from '../entities/payment.entity';
import {
  BillingProvider,
  SubscriptionStatus,
} from '../entities/subscription.entity';

export class BillingWebhookModel {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly targetWorkspaceId: string | null,
    public readonly subscriptionId: string | null,
    public readonly paymentId: string | null,
    public readonly invoiceId: string | null,
    public readonly provider: BillingProvider,
    public readonly providerEventId: string,
    public readonly eventType: string,
    public readonly orderCode: string | null,
    public readonly providerTransactionId: string | null,
    public readonly status: BillingWebhookStatus,
    public readonly payload: Record<string, unknown>,
    public readonly processedAt: Date | null,
    public readonly errorMessage: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly userEmail: string | null = null,
    public readonly username: string | null = null,
    public readonly targetWorkspaceName: string | null = null,
    public readonly targetWorkspaceSlug: string | null = null,
    public readonly subscriptionStatus: SubscriptionStatus | null = null,
    public readonly paymentStatus: PaymentStatus | null = null,
    public readonly invoiceNumber: string | null = null,
  ) {}
}
