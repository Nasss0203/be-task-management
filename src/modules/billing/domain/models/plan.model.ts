import { PlanBillingInterval } from '../entities/plan.entity';

export class PlanModel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly priceAmount: number,
    public readonly currency: string,
    public readonly billingInterval: PlanBillingInterval,
    public readonly features: Record<string, unknown> | null,
    public readonly limits: Record<string, unknown> | null,
    public readonly isActive: boolean,
    public readonly sortOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
