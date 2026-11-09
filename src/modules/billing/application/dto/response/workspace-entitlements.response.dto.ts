import type { BillingFeatureValueType } from '../../../domain/constants/billing-feature-value-type.constant';
import type { BillingPlanFeatureValue } from '../../../domain/entities/billing-plan-feature.entity';

export interface WorkspaceEntitlementFeatureDto {
  code: string;
  name: string;
  valueType: BillingFeatureValueType;
  limit: BillingPlanFeatureValue;
  usage: number | null;
}

export interface WorkspaceEntitlementsResponseDto {
  workspaceId: string;
  plan: {
    id: string;
    code: string;
    name: string;
  };
  periodStart: Date | null;
  periodEnd: Date | null;
  usagePeriod: {
    start: Date;
    end: Date;
  };
  features: WorkspaceEntitlementFeatureDto[];
}
