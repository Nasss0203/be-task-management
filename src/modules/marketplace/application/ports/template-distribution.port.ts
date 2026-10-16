import type { TemplateListingRepository } from '../../domain/repositories/template-listing.repository';
import type { TemplateEntitlementRepository } from '../../domain/repositories/template-entitlement.repository';

/** Read access for template use; distribution writes remain in Marketplace. */
export type TemplateDistributionPort = Pick<
  TemplateListingRepository,
  'findByTemplateId'
>;

export type TemplateEntitlementPort = Pick<
  TemplateEntitlementRepository,
  'findByTemplateAndUser'
>;
