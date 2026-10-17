import type { TemplateListingRepository } from '../../domain/repositories/template-listing.repository';
import type { TemplateEntitlementRepository } from '../../domain/repositories/template-entitlement.repository';
import type { FreeTemplateClaimService } from '../services/free-template-claim.service';

/** Read access for template use; distribution writes remain in Marketplace. */
export type TemplateDistributionPort = Pick<
  TemplateListingRepository,
  'findByTemplateId'
>;

export type TemplateEntitlementPort = Pick<
  TemplateEntitlementRepository,
  'findByTemplateAndUser'
>;

/** Grants a FREE_CLAIM inside the caller's transaction (used by Use Template). */
export type TemplateFreeClaimPort = Pick<FreeTemplateClaimService, 'claim'>;
