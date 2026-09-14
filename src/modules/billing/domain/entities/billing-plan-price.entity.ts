import { randomUUID } from 'crypto';

import { BillingInterval } from '../constants/billing-interval.constant';
import { BillingProvider } from '../constants/billing-provider.constant';

export type CreateBillingPlanPriceParams = {
  id?: string;
  planId: string;
  billingInterval: BillingInterval;
  currency: string;
  amount: number;
  provider: BillingProvider;
  providerPriceId?: string | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReconstituteBillingPlanPriceParams = {
  id: string;
  planId: string;
  billingInterval: BillingInterval;
  currency: string;
  amount: number;
  provider: BillingProvider;
  providerPriceId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class BillingPlanPrice {
  private constructor(
    private readonly id: string,
    private readonly planId: string,
    private readonly billingInterval: BillingInterval,
    private readonly currency: string,
    private readonly amount: number,
    private readonly provider: BillingProvider,
    private readonly providerPriceId: string | null,
    private readonly isActive: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(params: CreateBillingPlanPriceParams): BillingPlanPrice {
    const now = new Date();

    return new BillingPlanPrice(
      params.id ?? randomUUID(),
      params.planId,
      params.billingInterval,
      params.currency.toUpperCase(),
      params.amount,
      params.provider,
      params.providerPriceId ?? null,
      params.isActive ?? true,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static reconstitute(
    params: ReconstituteBillingPlanPriceParams,
  ): BillingPlanPrice {
    return new BillingPlanPrice(
      params.id,
      params.planId,
      params.billingInterval,
      params.currency,
      params.amount,
      params.provider,
      params.providerPriceId,
      params.isActive,
      params.createdAt,
      params.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getPlanId(): string {
    return this.planId;
  }

  getBillingInterval(): BillingInterval {
    return this.billingInterval;
  }

  getCurrency(): string {
    return this.currency;
  }

  getAmount(): number {
    return this.amount;
  }

  getProvider(): BillingProvider {
    return this.provider;
  }

  getProviderPriceId(): string | null {
    return this.providerPriceId;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
