import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';
import {
  BillingProvider,
  SubscriptionStatus,
} from '../entities/subscription.entity';

export class PaymentModel {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly planId: string,
    public readonly targetWorkspaceId: string | null,
    public readonly subscriptionId: string | null,
    public readonly invoiceId: string | null,
    public readonly orderCode: string,
    public readonly provider: BillingProvider,
    public readonly providerPaymentId: string | null,
    public readonly providerOrderId: string | null,
    public readonly providerRequestId: string | null,
    public readonly providerTransactionId: string | null,
    public readonly paymentMethod: PaymentMethod,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: PaymentStatus,
    public readonly paymentUrl: string | null,
    public readonly expiredAt: Date | null,
    public readonly paidAt: Date | null,
    public readonly failedReason: string | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly userEmail: string | null = null,
    public readonly username: string | null = null,
    public readonly planName: string | null = null,
    public readonly planSlug: string | null = null,
    public readonly targetWorkspaceName: string | null = null,
    public readonly targetWorkspaceSlug: string | null = null,
    public readonly invoiceNumber: string | null = null,
    public readonly subscriptionStatus: SubscriptionStatus | null = null,
  ) {}
}
