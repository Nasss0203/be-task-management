import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { BillingFeatureCode } from '../../domain/constants/billing-feature-code.constant';

export interface WorkspaceEntitlementPort {
  assertWithinLimit(
    workspaceId: string,
    feature: BillingFeatureCode,
    increment?: number,
    context?: PersistenceContext,
  ): Promise<void>;
}
