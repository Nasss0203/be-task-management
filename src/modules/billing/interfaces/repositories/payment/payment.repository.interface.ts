import { EntityManager } from 'typeorm';
import { Payment } from '../../../domain/entities/payment.entity';
import { Plan } from '../../../domain/entities/plan.entity';
import { BillingProvider } from '../../../domain/entities/subscription.entity';

export interface CreatePendingPaymentInput {
  userId: string;
  plan: Plan;
  orderCode: string;
  targetWorkspaceId?: string | null;
  provider?: BillingProvider;
}

export interface UpdatePaymentGatewayInput {
  paymentId: string;
  paymentUrl: string;
  providerOrderId: string;
  providerRequestId?: string | null;
  providerTransactionId?: string | null;
  providerPaymentId?: string | null;
  rawResponse: Record<string, unknown>;
  expiredAt?: Date | null;
}

export interface MarkPaymentFailedInput {
  paymentId: string;
  failedReason: string;
  metadata?: Record<string, unknown> | null;
}

export interface MarkPaymentSucceededInput {
  paymentId: string;
  providerTransactionId: string | null;
  metadata: Record<string, unknown>;
}

export interface MarkPaymentStatusFailedInput {
  paymentId: string;
  failedReason: string;
  metadata: Record<string, unknown>;
}

export interface UpdatePaymentMetadataInput {
  paymentId: string;
  metadata: Record<string, unknown>;
}

export interface PaymentRepository {
  createPendingPayment(
    input: CreatePendingPaymentInput,
    manager?: EntityManager,
  ): Promise<Payment>;

  updatePaymentGateway(
    input: UpdatePaymentGatewayInput,
    manager?: EntityManager,
  ): Promise<Payment>;

  markPaymentFailed(
    input: MarkPaymentFailedInput,
    manager?: EntityManager,
  ): Promise<void>;

  findPaymentByOrderCode(
    orderCode: string,
    manager?: EntityManager,
  ): Promise<Payment | null>;

  findPaymentByProviderOrderId(
    provider: BillingProvider,
    providerOrderId: string,
    manager?: EntityManager,
  ): Promise<Payment | null>;

  markPaymentSucceeded(
    input: MarkPaymentSucceededInput,
    manager?: EntityManager,
  ): Promise<Payment>;

  markPaymentStatusFailed(
    input: MarkPaymentStatusFailedInput,
    manager?: EntityManager,
  ): Promise<Payment>;

  updatePaymentMetadata(
    input: UpdatePaymentMetadataInput,
    manager?: EntityManager,
  ): Promise<Payment>;
}
