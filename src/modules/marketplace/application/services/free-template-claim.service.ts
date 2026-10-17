import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type {
  TemplateContentPort,
  TemplateVersionPort,
} from 'src/modules/template/application/ports/template-content.port';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import { TemplateStatus } from '../../../template/domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../template/domain/enums/template-visibility.enum';
import { TEMPLATE_TYPES } from '../../../template/template.types';
import { TemplateEntitlement } from '../../domain/aggregates/template-entitlement/template-entitlement.aggregate';
import { TemplateListingStatus } from '../../domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../domain/enums/template-offer-type.enum';
import type { TemplateEntitlementRepository } from '../../domain/repositories/template-entitlement.repository';
import type { TemplateListingRepository } from '../../domain/repositories/template-listing.repository';

const ENTITLEMENT_UNIQUE_CONSTRAINT = 'UQ_template_entitlements_template_user';

/**
 * Grants a FREE_CLAIM inside the caller's transaction, so callers like
 * Use Template can make the claim and their own work atomic.
 * Returns the existing entitlement (FREE_CLAIM or PAID_PURCHASE) untouched.
 */
@Injectable()
export class FreeTemplateClaimService {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templates: TemplateContentPort,
    @Inject(MARKETPLACE_TYPES.repositories.TemplateListingRepository)
    private readonly listings: TemplateListingRepository,
    @Inject(TEMPLATE_TYPES.ports.Versions)
    private readonly versions: TemplateVersionPort,
    @Inject(MARKETPLACE_TYPES.repositories.TemplateEntitlementRepository)
    private readonly entitlements: TemplateEntitlementRepository,
  ) {}

  async claim(
    templateId: string,
    userId: string,
    context: PersistenceContext,
  ): Promise<TemplateEntitlement> {
    const existing = await this.entitlements.findByTemplateAndUser(
      templateId,
      userId,
      context,
    );
    if (existing) return existing;

    // Serialize new claims with listing pricing changes before checking FREE.
    const template = await this.templates.findByIdForUpdate(
      templateId,
      context,
    );
    if (
      !template ||
      template.getVisibility() !== TemplateVisibility.PUBLIC ||
      template.getStatus() === TemplateStatus.ARCHIVED
    ) {
      throw new NotFoundException('Template not found');
    }

    const listing = await this.listings.findByTemplateId(templateId, context);
    if (!listing || listing.getStatus() !== TemplateListingStatus.PUBLISHED) {
      throw new NotFoundException('Template not found');
    }
    if (listing.getOfferType() !== TemplateOfferType.FREE) {
      throw new BadRequestException('Template listing is not free');
    }

    const publishedVersion = listing.getPublishedVersionId()
      ? await this.versions.findById(listing.getPublishedVersionId()!, context)
      : await this.versions.findPublishedByTemplateId(templateId, context);
    if (
      !publishedVersion ||
      publishedVersion.isDraft() ||
      publishedVersion.getTemplateId() !== template.getId()
    ) {
      throw new NotFoundException('Template not found');
    }

    return this.entitlements.create(
      TemplateEntitlement.create({ templateId, userId }),
      context,
    );
  }
}

/** A concurrent claim won the unique (template, user) race. */
export function isDuplicateEntitlementError(error: unknown): boolean {
  const databaseError = error as {
    code?: string;
    constraint?: string;
    driverError?: { code?: string; constraint?: string };
  } | null;
  const constraintError = databaseError?.driverError ?? databaseError;
  return (
    constraintError?.code === '23505' &&
    constraintError.constraint === ENTITLEMENT_UNIQUE_CONSTRAINT
  );
}
