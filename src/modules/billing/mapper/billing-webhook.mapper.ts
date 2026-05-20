import {
  BillingWebhook,
  BillingWebhookStatus,
} from '../domain/entities/billing-webhook.entity';
import { BillingWebhookModel } from '../domain/models/billing-webhook.model';
import { BillingWebhookResponseDto } from '../dto/response/billing-webhook.response.dto';
import { BillingProvider } from '../domain/entities/subscription.entity';

export type SaveBillingWebhookInput = {
  id?: string;
  userId?: string | null;
  targetWorkspaceId?: string | null;
  subscriptionId?: string | null;
  paymentId?: string | null;
  invoiceId?: string | null;
  provider: BillingProvider;
  providerEventId: string;
  eventType: string;
  orderCode?: string | null;
  providerTransactionId?: string | null;
  status?: BillingWebhookStatus;
  payload: Record<string, unknown>;
  processedAt?: Date | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export class BillingWebhookMapper {
  static toModel(entity: BillingWebhook): BillingWebhookModel {
    return new BillingWebhookModel(
      entity.id,
      entity.userId ?? null,
      entity.targetWorkspaceId ?? null,
      entity.subscriptionId ?? null,
      entity.paymentId ?? null,
      entity.invoiceId ?? null,
      entity.provider,
      entity.providerEventId,
      entity.eventType,
      entity.orderCode ?? null,
      entity.providerTransactionId ?? null,
      entity.status,
      entity.payload,
      entity.processedAt ?? null,
      entity.errorMessage ?? null,
      entity.createdAt,
      entity.updatedAt,
      entity.user?.email ?? null,
      entity.user?.username ?? null,
      entity.targetWorkspace?.name ?? null,
      entity.targetWorkspace?.slug ?? null,
      entity.subscription?.status ?? null,
      entity.payment?.status ?? null,
      entity.invoice?.invoiceNumber ?? null,
    );
  }

  static toEntity(
    model: BillingWebhookModel | SaveBillingWebhookInput,
  ): BillingWebhook {
    const e = new BillingWebhook();

    if ('id' in model && model.id != null) {
      e.id = model.id;
    }

    e.userId = model.userId ?? null;
    e.targetWorkspaceId = model.targetWorkspaceId ?? null;
    e.subscriptionId = model.subscriptionId ?? null;
    e.paymentId = model.paymentId ?? null;
    e.invoiceId = model.invoiceId ?? null;
    e.provider = model.provider;
    e.providerEventId = model.providerEventId;
    e.eventType = model.eventType;
    e.orderCode = model.orderCode ?? null;
    e.providerTransactionId = model.providerTransactionId ?? null;
    e.status = model.status ?? BillingWebhookStatus.RECEIVED;
    e.payload = model.payload;
    e.processedAt = model.processedAt ?? null;
    e.errorMessage = model.errorMessage ?? null;

    if ('createdAt' in model && model.createdAt != null) {
      e.createdAt = model.createdAt;
    }

    if ('updatedAt' in model && model.updatedAt != null) {
      e.updatedAt = model.updatedAt;
    }

    return e;
  }

  static toResponse(model: BillingWebhookModel): BillingWebhookResponseDto {
    return {
      id: model.id,
      userId: model.userId,
      targetWorkspaceId: model.targetWorkspaceId,
      subscriptionId: model.subscriptionId,
      paymentId: model.paymentId,
      invoiceId: model.invoiceId,
      provider: model.provider,
      providerEventId: model.providerEventId,
      eventType: model.eventType,
      orderCode: model.orderCode,
      providerTransactionId: model.providerTransactionId,
      status: model.status,
      payload: model.payload,
      processedAt: model.processedAt,
      errorMessage: model.errorMessage,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      userEmail: model.userEmail,
      username: model.username,
      targetWorkspaceName: model.targetWorkspaceName,
      targetWorkspaceSlug: model.targetWorkspaceSlug,
      subscriptionStatus: model.subscriptionStatus,
      paymentStatus: model.paymentStatus,
      invoiceNumber: model.invoiceNumber,
    };
  }

  static toResponseList(
    models: BillingWebhookModel[],
  ): BillingWebhookResponseDto[] {
    return models.map((item) => this.toResponse(item));
  }
}
