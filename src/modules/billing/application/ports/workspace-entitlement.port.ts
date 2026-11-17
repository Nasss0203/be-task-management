import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { BillingFeatureCode } from '../../domain/constants/billing-feature-code.constant';
import type { WorkspaceEntitlementsResponseDto } from '../dto/response/workspace-entitlements.response.dto';

export interface WorkspaceEntitlementPort {
  getEntitlements(
    workspaceId: string,
    now?: Date,
    context?: PersistenceContext,
  ): Promise<WorkspaceEntitlementsResponseDto>;

  assertWithinLimit(
    workspaceId: string,
    feature: BillingFeatureCode,
    increment?: number,
    context?: PersistenceContext,
  ): Promise<void>;
}
