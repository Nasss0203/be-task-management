import { InvoiceStatus } from '../../domain/entities/invoice.entity';
import { SubscriptionStatus } from '../../domain/entities/subscription.entity';

export class InvoiceResponseDto {
  id: string;
  userId: string;
  planId: string;
  subscriptionId: string | null;
  invoiceNumber: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: InvoiceStatus;
  periodStart: Date | null;
  periodEnd: Date | null;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  dueAt: Date | null;
  paidAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;

  userEmail: string | null;
  username: string | null;
  planName: string | null;
  planSlug: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionPlanId: string | null;
}
