import type {
  AdminActionActor,
  AdminActionChanges,
} from '../../domain/audit/admin-action';

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
  actor: AdminActionActor;
  changes: AdminActionChanges;
}

export interface CreateAdminBillingPlanPriceVersionInput {
  planId: string;
  priceId: string;
  amount: number;
  actor: AdminActionActor;
}

export interface AdminBillingPlanWriter {
  updatePlan(input: UpdateAdminBillingPlanInput): Promise<boolean>;

  createPriceVersion(
    input: CreateAdminBillingPlanPriceVersionInput,
  ): Promise<boolean>;
}
