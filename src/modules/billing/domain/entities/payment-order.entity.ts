import { randomUUID } from 'node:crypto';
import { BillingProvider } from '../constants/billing-provider.constant';
import { PaymentOrderStatus } from '../constants/payment-order-status.constant';

export interface CreatePaymentOrderParams {
  id?: string;
  workspaceId: string;
  subscriptionId?: string | null;
  planPriceId: string;
  provider: BillingProvider;
  orderCode: string;
  amount: number;
  currency: string;
  expiresAt?: Date | null;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstitutePaymentOrderParams {
  id: string;
  workspaceId: string;
  subscriptionId: string | null;
  planPriceId: string;
  provider: BillingProvider;
  orderCode: string;
  amount: number;
  currency: string;
  status: PaymentOrderStatus;
  expiresAt: Date | null;
  paidAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentOrder {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private subscriptionId: string | null,
    private readonly planPriceId: string,
    private readonly provider: BillingProvider,
    private readonly orderCode: string,
    private readonly amount: number,
    private readonly currency: string,
    private status: PaymentOrderStatus,
    private readonly expiresAt: Date | null,
    private paidAt: Date | null,
    private readonly createdBy: string,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(params: CreatePaymentOrderParams): PaymentOrder {
    const now = params.createdAt ?? new Date();
    const orderCode = this.normalizeOrderCode(params.orderCode);
    const currency = this.normalizeCurrency(params.currency);

    this.assertAmount(params.amount);

    if (params.expiresAt && params.expiresAt.getTime() <= now.getTime()) {
      throw new Error('Payment order expiration must be after creation time');
    }

    return new PaymentOrder(
      params.id ?? randomUUID(),
      params.workspaceId,
      params.subscriptionId ?? null,
      params.planPriceId,
      params.provider,
      orderCode,
      params.amount,
      currency,
      PaymentOrderStatus.PENDING,
      params.expiresAt ?? null,
      null,
      params.createdBy,
      now,
      params.updatedAt ?? now,
    );
  }

  static reconstitute(params: ReconstitutePaymentOrderParams): PaymentOrder {
    const orderCode = this.normalizeOrderCode(params.orderCode);
    const currency = this.normalizeCurrency(params.currency);

    this.assertAmount(params.amount);

    if (params.status === PaymentOrderStatus.PAID && !params.paidAt) {
      throw new Error('Paid payment order must have paidAt');
    }

    return new PaymentOrder(
      params.id,
      params.workspaceId,
      params.subscriptionId,
      params.planPriceId,
      params.provider,
      orderCode,
      params.amount,
      currency,
      params.status,
      params.expiresAt,
      params.paidAt,
      params.createdBy,
      params.createdAt,
      params.updatedAt,
    );
  }

  attachSubscription(subscriptionId: string, changedAt = new Date()): void {
    if (!subscriptionId.trim()) {
      throw new Error('Subscription ID is required');
    }

    this.subscriptionId = subscriptionId;
    this.updatedAt = changedAt;
  }

  markPaid(paidAt = new Date()): void {
    if (this.status === PaymentOrderStatus.PAID) {
      return;
    }

    this.ensurePending('mark as paid');

    this.status = PaymentOrderStatus.PAID;
    this.paidAt = paidAt;
    this.updatedAt = new Date();
  }

  markFailed(changedAt = new Date()): void {
    if (this.status === PaymentOrderStatus.FAILED) {
      return;
    }

    this.ensurePending('mark as failed');

    this.status = PaymentOrderStatus.FAILED;
    this.updatedAt = changedAt;
  }

  markExpired(changedAt = new Date()): void {
    if (this.status === PaymentOrderStatus.EXPIRED) {
      return;
    }

    this.ensurePending('mark as expired');

    this.status = PaymentOrderStatus.EXPIRED;
    this.updatedAt = changedAt;
  }

  cancel(changedAt = new Date()): void {
    if (this.status === PaymentOrderStatus.CANCELED) {
      return;
    }

    this.ensurePending('cancel');

    this.status = PaymentOrderStatus.CANCELED;
    this.updatedAt = changedAt;
  }

  isPending(): boolean {
    return this.status === PaymentOrderStatus.PENDING;
  }

  isExpiredAt(date = new Date()): boolean {
    return Boolean(
      this.expiresAt && this.expiresAt.getTime() <= date.getTime(),
    );
  }

  private ensurePending(action: string): void {
    if (!this.isPending()) {
      throw new Error(
        `Cannot ${action} payment order with status ${this.status}`,
      );
    }
  }

  private static assertAmount(amount: number): void {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error('Payment order amount must be a positive safe integer');
    }
  }

  private static normalizeCurrency(currency: string): string {
    const normalized = currency.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new Error('Payment order currency must contain 3 letters');
    }

    return normalized;
  }

  private static normalizeOrderCode(orderCode: string): string {
    const normalized = orderCode.trim().toUpperCase();

    if (!/^[A-Z0-9]+$/.test(normalized)) {
      throw new Error(
        'Payment order code must contain only letters and numbers',
      );
    }

    if (normalized.length > 100) {
      throw new Error('Payment order code must not exceed 100 characters');
    }

    return normalized;
  }

  getId(): string {
    return this.id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getSubscriptionId(): string | null {
    return this.subscriptionId;
  }

  getPlanPriceId(): string {
    return this.planPriceId;
  }

  getProvider(): BillingProvider {
    return this.provider;
  }

  getOrderCode(): string {
    return this.orderCode;
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  getStatus(): PaymentOrderStatus {
    return this.status;
  }

  getExpiresAt(): Date | null {
    return this.expiresAt;
  }

  getPaidAt(): Date | null {
    return this.paidAt;
  }

  getCreatedBy(): string {
    return this.createdBy;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
