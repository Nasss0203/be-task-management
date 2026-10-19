import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type {
  TemplateContentPort,
  TemplateVersionPort,
} from 'src/modules/template/application/ports/template-content.port';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { TemplateStatus } from '../../../../../template/domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../../template/domain/enums/template-visibility.enum';

import { TemplatePurchaseAggregate } from '../../../../domain/aggregates/template-purchase/template-purchase.aggregate';
import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';

import { TemplatePurchaseEligibilityService } from '../../../services/template-purchase-eligibility.service';
import type { MarketplaceCommissionRateReader } from '../../../ports/marketplace-commission-rate-reader.port';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import type { TemplatePurchaseRepository } from '../../../../domain/repositories/template-purchase.repository';

import { CreateTemplatePurchaseCommand } from './create-template-purchase.command';

const PURCHASE_EXPIRATION_MS = 60 * 60 * 1000;

@Injectable()
export class CreateTemplatePurchaseHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templateRepository: TemplateContentPort,

    @Inject(TEMPLATE_TYPES.ports.Versions)
    private readonly versionRepository: TemplateVersionPort,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateListingRepository)
    private readonly listingRepository: TemplateListingRepository,

    @Inject(MARKETPLACE_TYPES.services.TemplatePurchaseEligibilityService)
    private readonly eligibility: TemplatePurchaseEligibilityService,

    @Inject(MARKETPLACE_TYPES.repositories.TemplatePurchaseRepository)
    private readonly purchaseRepository: TemplatePurchaseRepository,

    @Inject(MARKETPLACE_TYPES.ports.CommissionRateReader)
    private readonly commissionRates: MarketplaceCommissionRateReader,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: CreateTemplatePurchaseCommand,
  ): Promise<TemplatePurchaseAggregate> {
    try {
      return await this.unitOfWork.runInTransaction(async (context) => {
        // 1. Idempotency
        const existing =
          await this.purchaseRepository.findByBuyerAndIdempotencyKey(
            command.buyerId,
            command.idempotencyKey,
            context,
          );

        if (existing) {
          return this.resolveExisting(existing, command);
        }

        // 2. Lock Template
        const template = await this.templateRepository.findByIdForUpdate(
          command.templateId,
          context,
        );

        if (
          !template ||
          template.getVisibility() !== TemplateVisibility.PUBLIC ||
          template.getStatus() === TemplateStatus.ARCHIVED
        ) {
          throw new NotFoundException('Template not found');
        }

        // 3. Validate PAID Listing
        const listing = await this.listingRepository.findByTemplateId(
          command.templateId,
          context,
        );

        if (!listing || !listing.isPublished()) {
          throw new NotFoundException('Template listing not found');
        }

        if (listing.getOfferType() !== TemplateOfferType.PAID) {
          throw new BadRequestException('Template listing is not paid');
        }

        // 4. Creator, existing PAID ownership, pending reconciliation.
        // A FREE_CLAIM is allowed: settlement upgrades it to PAID_PURCHASE.
        await this.eligibility.assertCanPurchase(
          {
            templateId: template.getId(),
            templateCreatorId: template.getCreatedBy(),
            buyerId: command.buyerId,
          },
          context,
        );

        // 5. Resolve Published Version
        const publishedVersionId = listing.getPublishedVersionId();

        const version = publishedVersionId
          ? await this.versionRepository.findById(publishedVersionId, context)
          : await this.versionRepository.findPublishedByTemplateId(
              command.templateId,
              context,
            );

        if (
          !version ||
          version.isDraft() ||
          version.getTemplateId() !== template.getId()
        ) {
          throw new NotFoundException('Published version not found');
        }

        // 6. Snapshot Price
        const price = listing.getPrice();
        const commissionRateBps =
          await this.commissionRates.getCurrentRateBps(context);

        // 7. Create PENDING Purchase
        const purchase = TemplatePurchaseAggregate.create({
          templateId: template.getId(),
          listingId: listing.getId(),
          buyerId: command.buyerId,
          publishedVersionId: version.getId(),
          amount: price.getAmount(),
          currency: price.getCurrency(),
          commissionRateBps,
          idempotencyKey: command.idempotencyKey,
          expiresAt: new Date(Date.now() + PURCHASE_EXPIRATION_MS),
        });

        // 8. Persist Purchase
        return this.purchaseRepository.create(purchase, context);
      });
    } catch (error) {
      const databaseError = error as {
        code?: string;
        constraint?: string;
        driverError?: {
          code?: string;
          constraint?: string;
        };
      } | null;

      const constraintError = databaseError?.driverError ?? databaseError;

      if (
        constraintError?.code === '23505' &&
        constraintError.constraint ===
          'UQ_template_purchases_buyer_id_idempotency_key'
      ) {
        // Transaction đã rollback, đọc lại bằng context mới.
        const existing =
          await this.purchaseRepository.findByBuyerAndIdempotencyKey(
            command.buyerId,
            command.idempotencyKey,
          );

        if (existing) {
          return this.resolveExisting(existing, command);
        }
      }

      throw error;
    }
  }

  private resolveExisting(
    purchase: TemplatePurchaseAggregate,
    command: CreateTemplatePurchaseCommand,
  ): TemplatePurchaseAggregate {
    if (purchase.getTemplateId() !== command.templateId) {
      throw new ConflictException(
        'Idempotency key already used for another template',
      );
    }

    return purchase;
  }
}
