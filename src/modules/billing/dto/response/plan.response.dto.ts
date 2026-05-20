import { PlanBillingInterval } from '../../domain/entities/plan.entity';

export class PlanResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceAmount: number;
  currency: string;
  billingInterval: PlanBillingInterval;
  features: Record<string, unknown> | null;
  limits: Record<string, unknown> | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
