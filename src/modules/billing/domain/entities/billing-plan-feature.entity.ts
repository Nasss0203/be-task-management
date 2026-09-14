import { randomUUID } from 'crypto';

export type BillingPlanFeatureValue = boolean | number | string;

export type CreateBillingPlanFeatureParams = {
  id?: string;
  planId: string;
  featureId: string;
  value: BillingPlanFeatureValue;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReconstituteBillingPlanFeatureParams = {
  id: string;
  planId: string;
  featureId: string;
  value: BillingPlanFeatureValue;
  createdAt: Date;
  updatedAt: Date;
};

export class BillingPlanFeature {
  private constructor(
    private readonly id: string,
    private readonly planId: string,
    private readonly featureId: string,
    private readonly value: BillingPlanFeatureValue,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(params: CreateBillingPlanFeatureParams): BillingPlanFeature {
    const now = new Date();

    return new BillingPlanFeature(
      params.id ?? randomUUID(),
      params.planId,
      params.featureId,
      params.value,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static reconstitute(
    params: ReconstituteBillingPlanFeatureParams,
  ): BillingPlanFeature {
    return new BillingPlanFeature(
      params.id,
      params.planId,
      params.featureId,
      params.value,
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

  getFeatureId(): string {
    return this.featureId;
  }

  getValue(): BillingPlanFeatureValue {
    return this.value;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
