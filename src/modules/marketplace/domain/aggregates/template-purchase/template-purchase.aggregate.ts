import { randomUUID } from 'crypto';

export enum TemplatePurchaseStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  RECONCILIATION_REQUIRED = 'RECONCILIATION_REQUIRED',
}

export enum TemplatePurchaseProvider {
  STRIPE = 'STRIPE',
  SEPAY = 'SEPAY',
}

export type CreateTemplatePurchaseParams = {
  id?: string;
  templateId: string;
  listingId: string;
  buyerId: string;
  publishedVersionId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  expiresAt: Date;
};

export type RestoreTemplatePurchaseParams = CreateTemplatePurchaseParams & {
  id: string;
  orderCode: string;
  status: TemplatePurchaseStatus;
  provider: TemplatePurchaseProvider | null;
  entitlementId: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class TemplatePurchaseAggregate {
  private constructor(
    private readonly id: string,
    private readonly orderCode: string,
    private readonly templateId: string,
    private readonly listingId: string,
    private readonly buyerId: string,
    private readonly publishedVersionId: string,
    private readonly amount: number,
    private readonly currency: string,
    private readonly idempotencyKey: string,
    private readonly expiresAt: Date,
    private status: TemplatePurchaseStatus,
    private provider: TemplatePurchaseProvider | null,
    private entitlementId: string | null,
    private paidAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(
    params: CreateTemplatePurchaseParams,
  ): TemplatePurchaseAggregate {
    const requiredIds = [
      params.templateId,
      params.listingId,
      params.buyerId,
      params.publishedVersionId,
      params.idempotencyKey,
    ];

    if (
      requiredIds.some((value) => typeof value !== 'string' || !value.trim())
    ) {
      throw new Error('Purchase identifiers are required');
    }

    if (!Number.isSafeInteger(params.amount) || params.amount <= 0) {
      throw new Error('Purchase amount must be positive');
    }

    if (params.currency !== 'VND') {
      throw new Error('Only VND is supported');
    }

    if (
      !(params.expiresAt instanceof Date) ||
      !Number.isFinite(params.expiresAt.getTime()) ||
      params.expiresAt.getTime() <= Date.now()
    ) {
      throw new Error('Invalid purchase expiration');
    }

    const now = new Date();

    return new TemplatePurchaseAggregate(
      params.id ?? randomUUID(),
      `TP${randomUUID().replace(/-/g, '').toUpperCase()}`,
      params.templateId,
      params.listingId,
      params.buyerId,
      params.publishedVersionId,
      params.amount,
      params.currency,
      params.idempotencyKey,
      new Date(params.expiresAt),
      TemplatePurchaseStatus.PENDING,
      null,
      null,
      null,
      now,
      now,
    );
  }

  static restore(
    params: RestoreTemplatePurchaseParams,
  ): TemplatePurchaseAggregate {
    return new TemplatePurchaseAggregate(
      params.id,
      params.orderCode,
      params.templateId,
      params.listingId,
      params.buyerId,
      params.publishedVersionId,
      params.amount,
      params.currency,
      params.idempotencyKey,
      params.expiresAt,
      params.status,
      params.provider,
      params.entitlementId,
      params.paidAt,
      params.createdAt,
      params.updatedAt,
    );
  }

  selectProvider(provider: TemplatePurchaseProvider): void {
    if (this.status !== TemplatePurchaseStatus.PENDING) {
      throw new Error('Purchase is not pending');
    }

    if (this.expiresAt.getTime() <= Date.now()) {
      throw new Error('Purchase has expired');
    }

    if (this.provider && this.provider !== provider) {
      throw new Error('Payment provider already selected');
    }

    if (this.provider === provider) return;

    this.provider = provider;
    this.updatedAt = new Date();
  }

  /**
   * Chỉ Settlement Service được gọi sau khi đã xác minh
   * webhook, amount, currency và payment transaction.
   */
  markPaid(entitlementId: string): void {
    if (!entitlementId.trim()) {
      throw new Error('Entitlement id is required');
    }

    if (this.status === TemplatePurchaseStatus.PAID) {
      if (this.entitlementId === entitlementId) return;
      throw new Error('Purchase already settled');
    }

    if (this.status !== TemplatePurchaseStatus.PENDING) {
      throw new Error('Purchase requires reconciliation');
    }

    if (!this.provider) {
      throw new Error('Payment provider is required');
    }

    if (this.expiresAt.getTime() <= Date.now()) {
      throw new Error('Expired purchase requires reconciliation');
    }

    this.status = TemplatePurchaseStatus.PAID;
    this.entitlementId = entitlementId;
    this.paidAt = new Date();
    this.updatedAt = new Date();
  }

  expire(): void {
    if (this.status !== TemplatePurchaseStatus.PENDING) return;

    if (this.expiresAt.getTime() > Date.now()) {
      throw new Error('Purchase has not expired');
    }

    this.status = TemplatePurchaseStatus.EXPIRED;
    this.updatedAt = new Date();
  }

  fail(): void {
    if (this.status !== TemplatePurchaseStatus.PENDING) {
      throw new Error('Only pending purchases can fail');
    }

    this.status = TemplatePurchaseStatus.FAILED;
    this.updatedAt = new Date();
  }

  requireReconciliation(): void {
    if (this.status === TemplatePurchaseStatus.PAID) {
      throw new Error('Paid purchase cannot be reconciled again');
    }

    if (this.status === TemplatePurchaseStatus.RECONCILIATION_REQUIRED) {
      return;
    }

    this.status = TemplatePurchaseStatus.RECONCILIATION_REQUIRED;
    this.updatedAt = new Date();
  }

  getId(): string {
    return this.id;
  }
  getOrderCode(): string {
    return this.orderCode;
  }
  getTemplateId(): string {
    return this.templateId;
  }
  getListingId(): string {
    return this.listingId;
  }
  getBuyerId(): string {
    return this.buyerId;
  }
  getPublishedVersionId(): string {
    return this.publishedVersionId;
  }
  getAmount(): number {
    return this.amount;
  }
  getCurrency(): string {
    return this.currency;
  }
  getIdempotencyKey(): string {
    return this.idempotencyKey;
  }
  getExpiresAt(): Date {
    return new Date(this.expiresAt);
  }
  getStatus(): TemplatePurchaseStatus {
    return this.status;
  }
  getProvider(): TemplatePurchaseProvider | null {
    return this.provider;
  }
  getEntitlementId(): string | null {
    return this.entitlementId;
  }
  getPaidAt(): Date | null {
    return this.paidAt;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}

export { TemplatePurchaseAggregate as TemplatePurchase };
