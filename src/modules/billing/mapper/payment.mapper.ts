import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../domain/entities/payment.entity';
import { PaymentModel } from '../domain/models/payment.model';
import { PaymentResponseDto } from '../dto/response/payment.response.dto';
import { BillingProvider } from '../domain/entities/subscription.entity';

export type SavePaymentInput = {
  id?: string;
  userId: string;
  planId: string;
  targetWorkspaceId?: string | null;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  orderCode: string;
  provider?: BillingProvider;
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  providerRequestId?: string | null;
  providerTransactionId?: string | null;
  paymentMethod?: PaymentMethod;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  paymentUrl?: string | null;
  expiredAt?: Date | null;
  paidAt?: Date | null;
  failedReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export class PaymentMapper {
  static toModel(entity: Payment): PaymentModel {
    return new PaymentModel(
      entity.id,
      entity.userId,
      entity.planId,
      entity.targetWorkspaceId ?? null,
      entity.subscriptionId ?? null,
      entity.invoiceId ?? null,
      entity.orderCode,
      entity.provider,
      entity.providerPaymentId ?? null,
      entity.providerOrderId ?? null,
      entity.providerRequestId ?? null,
      entity.providerTransactionId ?? null,
      entity.paymentMethod,
      entity.amount,
      entity.currency,
      entity.status,
      entity.paymentUrl ?? null,
      entity.expiredAt ?? null,
      entity.paidAt ?? null,
      entity.failedReason ?? null,
      entity.metadata ?? null,
      entity.createdAt,
      entity.updatedAt,
      entity.user?.email ?? null,
      entity.user?.username ?? null,
      entity.plan?.name ?? null,
      entity.plan?.slug ?? null,
      entity.targetWorkspace?.name ?? null,
      entity.targetWorkspace?.slug ?? null,
      entity.invoice?.invoiceNumber ?? null,
      entity.subscription?.status ?? null,
    );
  }

  static toEntity(model: PaymentModel | SavePaymentInput): Payment {
    const e = new Payment();

    if ('id' in model && model.id != null) {
      e.id = model.id;
    }

    e.userId = model.userId;
    e.planId = model.planId;
    e.targetWorkspaceId = model.targetWorkspaceId ?? null;
    e.subscriptionId = model.subscriptionId ?? null;
    e.invoiceId = model.invoiceId ?? null;
    e.orderCode = model.orderCode;
    e.provider = model.provider ?? BillingProvider.MANUAL;
    e.providerPaymentId = model.providerPaymentId ?? null;
    e.providerOrderId = model.providerOrderId ?? null;
    e.providerRequestId = model.providerRequestId ?? null;
    e.providerTransactionId = model.providerTransactionId ?? null;
    e.paymentMethod = model.paymentMethod ?? PaymentMethod.UNKNOWN;
    e.amount = model.amount;
    e.currency = model.currency ?? 'VND';
    e.status = model.status ?? PaymentStatus.PENDING;
    e.paymentUrl = model.paymentUrl ?? null;
    e.expiredAt = model.expiredAt ?? null;
    e.paidAt = model.paidAt ?? null;
    e.failedReason = model.failedReason ?? null;
    e.metadata = model.metadata ?? null;

    if ('createdAt' in model && model.createdAt != null) {
      e.createdAt = model.createdAt;
    }

    if ('updatedAt' in model && model.updatedAt != null) {
      e.updatedAt = model.updatedAt;
    }

    return e;
  }

  static toResponse(model: PaymentModel): PaymentResponseDto {
    return {
      id: model.id,
      userId: model.userId,
      planId: model.planId,
      targetWorkspaceId: model.targetWorkspaceId,
      subscriptionId: model.subscriptionId,
      invoiceId: model.invoiceId,
      orderCode: model.orderCode,
      provider: model.provider,
      providerPaymentId: model.providerPaymentId,
      providerOrderId: model.providerOrderId,
      providerRequestId: model.providerRequestId,
      providerTransactionId: model.providerTransactionId,
      paymentMethod: model.paymentMethod,
      amount: model.amount,
      currency: model.currency,
      status: model.status,
      paymentUrl: model.paymentUrl,
      expiredAt: model.expiredAt,
      paidAt: model.paidAt,
      failedReason: model.failedReason,
      metadata: model.metadata,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      userEmail: model.userEmail,
      username: model.username,
      planName: model.planName,
      planSlug: model.planSlug,
      targetWorkspaceName: model.targetWorkspaceName,
      targetWorkspaceSlug: model.targetWorkspaceSlug,
      invoiceNumber: model.invoiceNumber,
      subscriptionStatus: model.subscriptionStatus,
    };
  }

  static toResponseList(models: PaymentModel[]): PaymentResponseDto[] {
    return models.map((item) => this.toResponse(item));
  }
}
