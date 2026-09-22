export type AdminBillingPlanFeatureValue = boolean | number | string;

export interface UpdateAdminBillingPlanFeatureInput {
  featureId: string;
  value: AdminBillingPlanFeatureValue;
}

export interface UpdateAdminBillingPlanInput {
  planId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isPublic: boolean;
  features: readonly UpdateAdminBillingPlanFeatureInput[];
}

export interface CreateAdminBillingPlanPriceVersionInput {
  planId: string;
  priceId: string;
  amount: number;
}

export interface AdminBillingPlanWriter {
  updatePlan(input: UpdateAdminBillingPlanInput): Promise<boolean>;

  createPriceVersion(
    input: CreateAdminBillingPlanPriceVersionInput,
  ): Promise<boolean>;
}
