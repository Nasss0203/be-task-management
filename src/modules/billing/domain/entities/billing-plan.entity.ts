import { randomUUID } from 'crypto';

export type CreateBillingPlanParams = {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReconstituteBillingPlanParams = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class BillingPlan {
  private constructor(
    private readonly id: string,
    private readonly code: string,
    private readonly name: string,
    private readonly description: string | null,
    private readonly isActive: boolean,
    private readonly isPublic: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(params: CreateBillingPlanParams): BillingPlan {
    const now = new Date();

    return new BillingPlan(
      params.id ?? randomUUID(),
      params.code,
      params.name,
      params.description ?? null,
      params.isActive ?? true,
      params.isPublic ?? true,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static reconstitute(params: ReconstituteBillingPlanParams): BillingPlan {
    return new BillingPlan(
      params.id,
      params.code,
      params.name,
      params.description,
      params.isActive,
      params.isPublic,
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

  getIsActive(): boolean {
    return this.isActive;
  }

  getIsPublic(): boolean {
    return this.isPublic;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
