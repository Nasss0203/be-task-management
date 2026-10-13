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
}
