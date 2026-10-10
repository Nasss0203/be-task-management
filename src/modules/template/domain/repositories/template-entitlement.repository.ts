import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { TemplateEntitlement } from '../aggregates/template-entitlement/template-entitlement.aggregate';

export interface TemplateEntitlementRepository {
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
