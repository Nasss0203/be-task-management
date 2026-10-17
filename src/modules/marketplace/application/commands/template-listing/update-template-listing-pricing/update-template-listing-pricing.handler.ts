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
import { TemplateListingResponseDto } from '../../../dto/template-listing/template-listing.response.dto';
import { resolveTemplateListingPricing } from '../../../services/template-listing-pricing';
import { UpdateTemplateListingPricingCommand } from './update-template-listing-pricing.command';
import { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplatePreviewLoader } from '../../../../../template/application/services/template-preview-loader.service';
import {
  assertDemoConfigFitsVersion,
  toBadRequest,
} from '../../../services/listing-demo-config-validator';

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
    private readonly previewLoader: TemplatePreviewLoader,
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

      const demoVersionChanges =
        command.demoVersionId !== undefined &&
        command.demoVersionId !== listing.getDemoVersionId();
      const effectiveDemoVersionId =
        command.demoVersionId !== undefined
          ? command.demoVersionId
          : listing.getDemoVersionId();
      // Mirrors the aggregate: a new demo version drops the old version's config.
      const effectiveDemoConfig =
        command.demoConfig !== undefined
          ? command.demoConfig
          : demoVersionChanges
            ? null
            : listing.getDemoConfig();

      const demoVersion = effectiveDemoVersionId
        ? await this.versions.findById(effectiveDemoVersionId, context)
        : null;
      if (command.demoVersionId) {
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
      }

      const effectiveOfferType =
        command.offerType !== undefined
          ? command.offerType
          : listing.getOfferType();
      toBadRequest(() =>
        TemplateListing.assertDemoPolicy(
          effectiveOfferType,
          effectiveDemoVersionId,
          listing!.getPublishedVersionId(),
          effectiveDemoConfig,
        ),
      );
      if (command.demoConfig !== undefined || demoVersionChanges) {
        await assertDemoConfigFitsVersion(
          this.previewLoader,
          template,
          demoVersion,
          effectiveDemoConfig,
        );
      }

      let modified = false;
      const current = listing;

      if (command.offerType !== undefined) {
        const { offerType, price } = resolveTemplateListingPricing(
          command.offerType,
          command.priceAmount,
          command.currency,
        );
        if (
          toBadRequest(() =>
            current.configureOffer(
              offerType,
              price,
              command.previewMode,
              command.demoVersionId,
              command.demoConfig,
            ),
          )
        ) {
          modified = true;
        }
      } else {
        if (
          command.previewMode !== undefined &&
          current.setPreviewMode(command.previewMode)
        ) {
          modified = true;
        }
        if (
          (command.demoVersionId !== undefined ||
            command.demoConfig !== undefined) &&
          toBadRequest(() =>
            current.setDemoPreview(command.demoVersionId, command.demoConfig),
          )
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
