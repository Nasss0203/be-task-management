import { randomUUID } from 'crypto';

import { BillingFeatureValueType } from '../constants/billing-feature-value-type.constant';

export type CreateBillingFeatureParams = {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  valueType: BillingFeatureValueType;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReconstituteBillingFeatureParams = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  valueType: BillingFeatureValueType;
  createdAt: Date;
  updatedAt: Date;
};

export class BillingFeature {
  private constructor(
    private readonly id: string,
    private readonly code: string,
    private readonly name: string,
    private readonly description: string | null,
    private readonly valueType: BillingFeatureValueType,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(params: CreateBillingFeatureParams): BillingFeature {
    const now = new Date();

    return new BillingFeature(
      params.id ?? randomUUID(),
      params.code,
      params.name,
      params.description ?? null,
      params.valueType,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static reconstitute(
    params: ReconstituteBillingFeatureParams,
  ): BillingFeature {
    return new BillingFeature(
      params.id,
      params.code,
      params.name,
      params.description,
      params.valueType,
      params.createdAt,
      params.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getCode(): string {
    return this.code;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string | null {
    return this.description;
  }

  getValueType(): BillingFeatureValueType {
    return this.valueType;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
