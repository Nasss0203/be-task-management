import { BillingFeatureValueType } from '../../../domain/constants/billing-feature-value-type.constant';
import { BillingInterval } from '../../../domain/constants/billing-interval.constant';
import { BillingProvider } from '../../../domain/constants/billing-provider.constant';
import type { BillingPlanFeatureValue } from '../../../domain/entities/billing-plan-feature.entity';

export class BillingPlanFeatureResponseDto {
  id: string;
  featureId: string;
  code: string;
  name: string;
  description: string | null;
  valueType: BillingFeatureValueType;
  value: BillingPlanFeatureValue;
}

export class BillingPlanPriceResponseDto {
  id: string;
  billingInterval: BillingInterval;
  currency: string;
  amount: number;
  provider: BillingProvider;
}

export class BillingPlanSummaryResponseDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  features: BillingPlanFeatureResponseDto[];
  prices: BillingPlanPriceResponseDto[];
}

export class BillingPlanListResponseDto {
  items: BillingPlanSummaryResponseDto[];
}
