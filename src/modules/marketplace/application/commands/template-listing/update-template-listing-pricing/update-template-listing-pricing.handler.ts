import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { TemplateStatus } from '../../../../../template/domain/enums/template-status.enum';
import type {
  TemplateContentPort,
  TemplateVersionPort,
} from 'src/modules/template/application/ports/template-content.port';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import { TEMPLATE_TYPES } from '../../../../../template/template.types';
import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';
import { TemplateListingResponseDto } from '../../../dto/template-listing/template-listing.response.dto';
import { resolveTemplateListingPricing } from '../../../services/template-listing-pricing';
import { UpdateTemplateListingPricingCommand } from './update-template-listing-pricing.command';

@Injectable()
export class UpdateTemplateListingPricingHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templates: TemplateContentPort,
    @Inject(TEMPLATE_TYPES.ports.Versions)
    private readonly versions: TemplateVersionPort,
    @Inject(MARKETPLACE_TYPES.repositories.TemplateListingRepository)
    private readonly listings: TemplateListingRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly authorization: AuthorizationService,
  ) {}

  async execute(
    command: UpdateTemplateListingPricingCommand,
  ): Promise<TemplateListingResponseDto> {
    return this.uow.runInTransaction(async (context) => {
      // All listing writes and new FREE claims serialize on the template row.
      const template = await this.templates.findByIdForUpdate(
        command.templateId,
        context,
      );
      if (!template) throw new NotFoundException('Page template not found');
      const allowed =
        template.getCreatedBy() === command.userId ||
        (await this.authorization.authorize({
          userId: command.userId,
          permissions: [PERMISSIONS.WORKSPACE_UPDATE],
          target: { type: 'workspace', id: template.getWorkspaceId() },
        }));
      if (!allowed)
        throw new ForbiddenException(
          'You do not have permission to update listing pricing',
        );
      if (template.getStatus() === TemplateStatus.ARCHIVED) {
        throw new BadRequestException(
          'Archived template cannot update listing pricing',
        );
      }
      let listing = await this.listings.findByTemplateId(
        command.templateId,
        context,
      );
      if (!listing) throw new NotFoundException('Template listing not found');

      if (
        command.offerType === undefined &&
        command.previewMode === undefined &&
        command.demoVersionId === undefined &&
        command.demoConfig === undefined
      ) {
        throw new BadRequestException(
          'At least one field (offer_type, preview_mode, demo_version_id, or demo_config) must be provided',
        );
      }

      if (command.demoVersionId) {
        const demoVersion = await this.versions.findById(
          command.demoVersionId,
          context,
        );
        if (!demoVersion) {
          throw new NotFoundException('Demo template version not found');
        }
        if (demoVersion.getTemplateId() !== template.getId()) {
          throw new BadRequestException(
            'Demo version does not belong to this template',
          );
        }
        if (!demoVersion.isPublished()) {
          throw new BadRequestException(
            'Demo version must be a published template version',
          );
        }
        const effectiveOfferType =
          command.offerType !== undefined
            ? command.offerType
            : listing.getOfferType();
        if (
          effectiveOfferType === TemplateOfferType.PAID &&
          listing.getPublishedVersionId() &&
          demoVersion.getId() === listing.getPublishedVersionId()
        ) {
          throw new BadRequestException(
            'Demo version cannot be the same as the published paid version',
          );
        }
      }

      let modified = false;

      if (command.offerType !== undefined) {
        const { offerType, price } = resolveTemplateListingPricing(
          command.offerType,
          command.priceAmount,
          command.currency,
        );
        if (
          listing.configureOffer(
            offerType,
            price,
            command.previewMode,
            command.demoVersionId,
            command.demoConfig,
          )
        ) {
          modified = true;
        }
      } else {
        if (
          command.previewMode !== undefined &&
          listing.setPreviewMode(command.previewMode)
        ) {
          modified = true;
        }
        if (
          (command.demoVersionId !== undefined ||
            command.demoConfig !== undefined) &&
          listing.setDemoPreview(command.demoVersionId, command.demoConfig)
        ) {
          modified = true;
        }
      }

      if (modified) {
        listing = await this.listings.save(listing, context);
      }
      const categories = await this.listings.findCategoriesByTemplateIds(
        [command.templateId],
        { activeOnly: false },
        context,
      );
      return TemplateListingResponseDto.fromDomain(
        listing,
        categories.get(command.templateId) ?? [],
      );
    });
  }
}
