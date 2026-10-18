import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import { MARKETPLACE_TYPES } from '../../marketplace.types';
import { TemplatePurchaseStatus } from '../../domain/aggregates/template-purchase/template-purchase.aggregate';
import { TemplateEntitlementSource } from '../../domain/enums/template-entitlement-source.enum';
import type { TemplateEntitlementRepository } from '../../domain/repositories/template-entitlement.repository';
import type { TemplatePurchaseRepository } from '../../domain/repositories/template-purchase.repository';

export interface TemplatePurchaseEligibilityInput {
  templateId: string;
  templateCreatorId: string;
  buyerId: string;
}

/**
 * Rules checked before a purchase or a Stripe Checkout is created.
 * A FREE_CLAIM does not block buying: the PAID purchase upgrades it.
 */
@Injectable()
export class TemplatePurchaseEligibilityService {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.TemplateEntitlementRepository)
    private readonly entitlementRepository: TemplateEntitlementRepository,

    @Inject(MARKETPLACE_TYPES.repositories.TemplatePurchaseRepository)
    private readonly purchaseRepository: TemplatePurchaseRepository,
  ) {}

  async assertCanPurchase(
    input: TemplatePurchaseEligibilityInput,
    context?: PersistenceContext,
  ): Promise<void> {
    if (input.templateCreatorId === input.buyerId) {
      throw new ForbiddenException('You cannot purchase your own template');
    }

    const entitlement = await this.entitlementRepository.findByTemplateAndUser(
      input.templateId,
      input.buyerId,
      context,
    );

    if (entitlement?.getSource() === TemplateEntitlementSource.PAID_PURCHASE) {
      throw new ConflictException('User already owns this template');
    }

    // A payment under reconciliation may already have charged the buyer.
    const awaitingReconciliation =
      await this.purchaseRepository.existsByBuyerTemplateAndStatus(
        input.buyerId,
        input.templateId,
        TemplatePurchaseStatus.RECONCILIATION_REQUIRED,
        context,
      );

    if (awaitingReconciliation) {
      throw new ConflictException(
        'A previous payment for this template is being reconciled',
      );
    }
  }
}
