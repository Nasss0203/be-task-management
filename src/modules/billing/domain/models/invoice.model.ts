import { InvoiceStatus } from '../entities/invoice.entity';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class InvoiceModel {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly planId: string,
    public readonly subscriptionId: string | null,
    public readonly invoiceNumber: string,
    public readonly amountDue: number,
    public readonly amountPaid: number,
    public readonly currency: string,
    public readonly status: InvoiceStatus,
    public readonly periodStart: Date | null,
    public readonly periodEnd: Date | null,
    public readonly hostedInvoiceUrl: string | null,
    public readonly invoicePdfUrl: string | null,
    public readonly dueAt: Date | null,
    public readonly paidAt: Date | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly userEmail: string | null = null,
    public readonly username: string | null = null,
    public readonly planName: string | null = null,
    public readonly planSlug: string | null = null,
    public readonly subscriptionStatus: SubscriptionStatus | null = null,
    public readonly subscriptionPlanId: string | null = null,
  ) {}
}
