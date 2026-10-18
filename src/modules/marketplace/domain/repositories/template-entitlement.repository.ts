import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { TemplateEntitlement } from '../aggregates/template-entitlement/template-entitlement.aggregate';

import type {
  FindClaimedTemplatesFilters,
  FindClaimedTemplatesResult,
} from './claimed-template.read-model';

export interface TemplateEntitlementRepository {
  findClaimedByUser(
    filters: FindClaimedTemplatesFilters,
    context?: PersistenceContext,
  ): Promise<FindClaimedTemplatesResult>;

  create(
    entitlement: TemplateEntitlement,
    context?: PersistenceContext,
  ): Promise<TemplateEntitlement>;

  findByTemplateAndUser(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<TemplateEntitlement | null>;

  /**
   * Turns a FREE_CLAIM into PAID_PURCHASE in place, keeping `created_at`.
   * A row older than its purchase therefore marks a FREE claim, so a later
   * refund can downgrade it instead of removing the user's FREE releases.
   * Returns false when the row is not a FREE_CLAIM (any more).
   */
  upgradeFreeClaimToPaidPurchase(
    entitlementId: string,
    context?: PersistenceContext,
  ): Promise<boolean>;
}
