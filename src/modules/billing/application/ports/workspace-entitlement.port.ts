import type { BillingFeatureCode } from '../../domain/constants/billing-feature-code.constant';

export interface WorkspaceEntitlementPort {
  assertWithinLimit(
    workspaceId: string,
    feature: BillingFeatureCode,
    increment?: number,
  ): Promise<void>;
}
