import { Invoice, InvoiceStatus } from '../domain/entities/invoice.entity';
import { InvoiceModel } from '../domain/models/invoice.model';
import { InvoiceResponseDto } from '../dto/response/invoice.response.dto';

export type SaveInvoiceInput = {
  id?: string;
  userId: string;
  planId: string;
  subscriptionId?: string | null;
  invoiceNumber: string;
  amountDue?: number;
  amountPaid?: number;
  currency?: string;
  status?: InvoiceStatus;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  hostedInvoiceUrl?: string | null;
  invoicePdfUrl?: string | null;
  dueAt?: Date | null;
  paidAt?: Date | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export class InvoiceMapper {
  static toModel(entity: Invoice): InvoiceModel {
    return new InvoiceModel(
      entity.id,
      entity.userId,
      entity.planId,
      entity.subscriptionId ?? null,
      entity.invoiceNumber,
      entity.amountDue,
      entity.amountPaid,
      entity.currency,
      entity.status,
      entity.periodStart ?? null,
      entity.periodEnd ?? null,
      entity.hostedInvoiceUrl ?? null,
      entity.invoicePdfUrl ?? null,
      entity.dueAt ?? null,
      entity.paidAt ?? null,
      entity.metadata ?? null,
      entity.createdAt,
      entity.updatedAt,
      entity.user?.email ?? null,
      entity.user?.username ?? null,
      entity.plan?.name ?? null,
      entity.plan?.slug ?? null,
      entity.subscription?.status ?? null,
      entity.subscription?.planId ?? null,
    );
  }

  static toEntity(model: InvoiceModel | SaveInvoiceInput): Invoice {
    const e = new Invoice();

    if ('id' in model && model.id != null) {
      e.id = model.id;
    }

    e.userId = model.userId;
    e.planId = model.planId;
    e.subscriptionId = model.subscriptionId ?? null;
    e.invoiceNumber = model.invoiceNumber;
    e.amountDue = model.amountDue ?? 0;
    e.amountPaid = model.amountPaid ?? 0;
    e.currency = model.currency ?? 'VND';
    e.status = model.status ?? InvoiceStatus.OPEN;
    e.periodStart = model.periodStart ?? null;
    e.periodEnd = model.periodEnd ?? null;
    e.hostedInvoiceUrl = model.hostedInvoiceUrl ?? null;
    e.invoicePdfUrl = model.invoicePdfUrl ?? null;
    e.dueAt = model.dueAt ?? null;
    e.paidAt = model.paidAt ?? null;
    e.metadata = model.metadata ?? null;

    if ('createdAt' in model && model.createdAt != null) {
      e.createdAt = model.createdAt;
    }

    if ('updatedAt' in model && model.updatedAt != null) {
      e.updatedAt = model.updatedAt;
    }

    return e;
  }

  static toResponse(model: InvoiceModel): InvoiceResponseDto {
    return {
      id: model.id,
      userId: model.userId,
      planId: model.planId,
      subscriptionId: model.subscriptionId,
      invoiceNumber: model.invoiceNumber,
      amountDue: model.amountDue,
      amountPaid: model.amountPaid,
      currency: model.currency,
      status: model.status,
      periodStart: model.periodStart,
      periodEnd: model.periodEnd,
      hostedInvoiceUrl: model.hostedInvoiceUrl,
      invoicePdfUrl: model.invoicePdfUrl,
      dueAt: model.dueAt,
      paidAt: model.paidAt,
      metadata: model.metadata,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      userEmail: model.userEmail,
      username: model.username,
      planName: model.planName,
      planSlug: model.planSlug,
      subscriptionStatus: model.subscriptionStatus,
      subscriptionPlanId: model.subscriptionPlanId,
    };
  }

  static toResponseList(models: InvoiceModel[]): InvoiceResponseDto[] {
    return models.map((item) => this.toResponse(item));
  }
}
