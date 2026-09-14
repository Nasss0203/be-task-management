import { randomUUID } from 'node:crypto';
import { BillingProvider } from '../constants/billing-provider.constant';
import { SubscriptionStatus } from '../constants/subscription-status.constant';

export interface CreateInitialFreeSubscriptionParams {
  id?: string;
  workspaceId: string;
  planId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteWorkspaceSubscriptionParams {
  id: string;
  workspaceId: string;
  planId: string;
  planPriceId: string | null;
  provider: BillingProvider | null;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivatePaidSubscriptionParams {
  planId: string;
  planPriceId: string;
  provider: BillingProvider;
  periodStart: Date;
  periodEnd: Date;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  changedAt?: Date;
}

export class WorkspaceSubscription {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private planId: string,
    private planPriceId: string | null,
    private provider: BillingProvider | null,
    private status: SubscriptionStatus,
    private currentPeriodStart: Date | null,
    private currentPeriodEnd: Date | null,
    private cancelAtPeriodEnd: boolean,
    private canceledAt: Date | null,
    private providerCustomerId: string | null,
    private providerSubscriptionId: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static createInitialFree(
    params: CreateInitialFreeSubscriptionParams,
  ): WorkspaceSubscription {
    const now = params.createdAt ?? new Date();

    return new WorkspaceSubscription(
      params.id ?? randomUUID(),
      params.workspaceId,
      params.planId,
      null,
      null,
      SubscriptionStatus.ACTIVE,
      null,
      null,
      false,
      null,
      null,
      null,
      now,
      params.updatedAt ?? now,
    );
  }

  static reconstitute(
    params: ReconstituteWorkspaceSubscriptionParams,
  ): WorkspaceSubscription {
    if (params.currentPeriodStart && params.currentPeriodEnd) {
      this.assertPeriod(params.currentPeriodStart, params.currentPeriodEnd);
    }

    return new WorkspaceSubscription(
      params.id,
      params.workspaceId,
      params.planId,
      params.planPriceId,
      params.provider,
      params.status,
      params.currentPeriodStart,
      params.currentPeriodEnd,
      params.cancelAtPeriodEnd,
      params.canceledAt,
      params.providerCustomerId,
      params.providerSubscriptionId,
      params.createdAt,
      params.updatedAt,
    );
  }

  activatePaidPlan(params: ActivatePaidSubscriptionParams): void {
    WorkspaceSubscription.assertPeriod(params.periodStart, params.periodEnd);

    this.planId = params.planId;
    this.planPriceId = params.planPriceId;
    this.provider = params.provider;
    this.status = SubscriptionStatus.ACTIVE;
    this.currentPeriodStart = params.periodStart;
    this.currentPeriodEnd = params.periodEnd;
    this.cancelAtPeriodEnd = false;
    this.canceledAt = null;
    this.providerCustomerId = params.providerCustomerId ?? null;
    this.providerSubscriptionId = params.providerSubscriptionId ?? null;
    this.updatedAt = params.changedAt ?? new Date();
  }

  renew(periodStart: Date, periodEnd: Date, changedAt = new Date()): void {
    WorkspaceSubscription.assertPeriod(periodStart, periodEnd);

    if (!this.planPriceId || !this.provider) {
      throw new Error('Free subscription does not require renewal');
    }

    this.status = SubscriptionStatus.ACTIVE;
    this.currentPeriodStart = periodStart;
    this.currentPeriodEnd = periodEnd;
    this.cancelAtPeriodEnd = false;
    this.canceledAt = null;
    this.updatedAt = changedAt;
  }

  scheduleCancellation(changedAt = new Date()): void {
    if (this.status !== SubscriptionStatus.ACTIVE) {
      throw new Error(
        'Only active subscriptions can be scheduled for cancellation',
      );
    }

    if (!this.currentPeriodEnd) {
      throw new Error('Free subscription cannot be scheduled for cancellation');
    }

    this.cancelAtPeriodEnd = true;
    this.updatedAt = changedAt;
  }

  markPastDue(changedAt = new Date()): void {
    if (this.status === SubscriptionStatus.PAST_DUE) {
      return;
    }

    if (this.status !== SubscriptionStatus.ACTIVE) {
      throw new Error('Only active subscriptions can become past due');
    }

    this.status = SubscriptionStatus.PAST_DUE;
    this.updatedAt = changedAt;
  }

  cancel(changedAt = new Date()): void {
    if (this.status === SubscriptionStatus.CANCELED) {
      return;
    }

    this.status = SubscriptionStatus.CANCELED;
    this.cancelAtPeriodEnd = false;
    this.canceledAt = changedAt;
    this.updatedAt = changedAt;
  }

  expire(changedAt = new Date()): void {
    if (this.status === SubscriptionStatus.EXPIRED) {
      return;
    }

    this.status = SubscriptionStatus.EXPIRED;
    this.cancelAtPeriodEnd = false;
    this.updatedAt = changedAt;
  }

  fallbackToFree(freePlanId: string, changedAt = new Date()): void {
    this.planId = freePlanId;
    this.planPriceId = null;
    this.provider = null;
    this.status = SubscriptionStatus.ACTIVE;
    this.currentPeriodStart = null;
    this.currentPeriodEnd = null;
    this.cancelAtPeriodEnd = false;
    this.canceledAt = null;
    this.providerCustomerId = null;
    this.providerSubscriptionId = null;
    this.updatedAt = changedAt;
  }

  private static assertPeriod(periodStart: Date, periodEnd: Date): void {
    if (
      Number.isNaN(periodStart.getTime()) ||
      Number.isNaN(periodEnd.getTime()) ||
      periodEnd.getTime() <= periodStart.getTime()
    ) {
      throw new Error('Subscription period end must be after period start');
    }
  }

  getId(): string {
    return this.id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getPlanId(): string {
    return this.planId;
  }

  getPlanPriceId(): string | null {
    return this.planPriceId;
  }

  getProvider(): BillingProvider | null {
    return this.provider;
  }

  getStatus(): SubscriptionStatus {
    return this.status;
  }

  getCurrentPeriodStart(): Date | null {
    return this.currentPeriodStart;
  }

  getCurrentPeriodEnd(): Date | null {
    return this.currentPeriodEnd;
  }

  getCancelAtPeriodEnd(): boolean {
    return this.cancelAtPeriodEnd;
  }

  getCanceledAt(): Date | null {
    return this.canceledAt;
  }

  getProviderCustomerId(): string | null {
    return this.providerCustomerId;
  }

  getProviderSubscriptionId(): string | null {
    return this.providerSubscriptionId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
