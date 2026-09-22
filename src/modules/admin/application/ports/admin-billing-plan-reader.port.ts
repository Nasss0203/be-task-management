import type { BillingFeatureValueType } from 'src/modules/billing/domain/constants/billing-feature-value-type.constant';
import type { BillingInterval } from 'src/modules/billing/domain/constants/billing-interval.constant';
import type { BillingProvider } from 'src/modules/billing/domain/constants/billing-provider.constant';

export interface ListAdminBillingPlansInput {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  isPublic?: boolean;
  provider?: BillingProvider;
  billingInterval?: BillingInterval;
}

export interface AdminBillingPlanPriceSummary {
  id: string;
  billingInterval: BillingInterval;
  currency: string;
  amount: number;
  provider: BillingProvider;
  providerPriceId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminBillingPlanSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isPublic: boolean;
  prices: AdminBillingPlanPriceSummary[];
  createdAt: Date;
  updatedAt: Date;
}

export type AdminBillingPlanFeatureValue = boolean | number | string;

export interface AdminBillingPlanFeatureSummary {
  id: string;
  planFeatureId: string | null;
  code: string;
  name: string;
  description: string | null;
  valueType: BillingFeatureValueType;
  value: AdminBillingPlanFeatureValue | null;
  isConfigured: boolean;
}

export interface AdminBillingPlanDetail extends AdminBillingPlanSummary {
  features: AdminBillingPlanFeatureSummary[];
}

export interface ListAdminBillingPlansResult {
  items: AdminBillingPlanSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminBillingPlanReader {
  listPlans(
    input: ListAdminBillingPlansInput,
  ): Promise<ListAdminBillingPlansResult>;

  getPlanById(planId: string): Promise<AdminBillingPlanDetail | null>;
}
