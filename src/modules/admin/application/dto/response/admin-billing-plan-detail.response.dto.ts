import type {
  AdminBillingPlanDetail,
  AdminBillingPlanFeatureSummary,
  AdminBillingPlanPriceSummary,
} from '../../ports/admin-billing-plan-reader.port';

export class AdminBillingPlanDetailResponseDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly isPublic: boolean;
  readonly prices: AdminBillingPlanPriceSummary[];
  readonly features: AdminBillingPlanFeatureSummary[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(plan: AdminBillingPlanDetail) {
    this.id = plan.id;
    this.code = plan.code;
    this.name = plan.name;
    this.description = plan.description;
    this.isActive = plan.isActive;
    this.isPublic = plan.isPublic;
    this.prices = plan.prices;
    this.features = plan.features;
    this.createdAt = plan.createdAt;
    this.updatedAt = plan.updatedAt;
  }
}
