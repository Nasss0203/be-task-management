import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type {
  TemplateContentPort,
  TemplateVersionPort,
} from 'src/modules/template/application/ports/template-content.port';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PageTemplateResponseDto } from '../../../../template/application/dto/page-template/page-template.response.dto';
import { TemplateVersionResponseDto } from '../../../../template/application/dto/template-version/template-version.response.dto';
import { TemplateStatus } from '../../../../template/domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../template/domain/enums/template-visibility.enum';
import { TEMPLATE_TYPES } from '../../../../template/template.types';
import { TemplateListing } from '../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateMarketplaceRelease } from '../../../domain/aggregates/template-marketplace-release/template-marketplace-release.aggregate';
import type { TemplateCategoryRepository } from '../../../domain/repositories/template-category.repository';
import type { TemplateListingRepository } from '../../../domain/repositories/template-listing.repository';
import type { TemplateMarketplaceReleaseRepository } from '../../../domain/repositories/template-marketplace-release.repository';
import { TemplateListingResponseDto } from '../../dto/template-listing/template-listing.response.dto';
import { resolveTemplateListingPricing } from '../../services/template-listing-pricing';
import { PublishTemplateToMarketplaceCommand } from './publish-template-to-marketplace.command';

@Injectable()
export class PublishTemplateToMarketplaceHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templates: TemplateContentPort,
    @Inject(TEMPLATE_TYPES.ports.Versions)
    private readonly versions: TemplateVersionPort,
    @Inject(MARKETPLACE_TYPES.repositories.TemplateListingRepository)
    private readonly listings: TemplateListingRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork) private readonly uow: UnitOfWork,
    private readonly authorization: AuthorizationService,
    @Inject(MARKETPLACE_TYPES.repositories.TemplateCategoryRepository)
    private readonly categories: TemplateCategoryRepository,
    @Inject(MARKETPLACE_TYPES.repositories.TemplateMarketplaceReleaseRepository)
    private readonly releases: TemplateMarketplaceReleaseRepository,
  ) {}
  async execute(command: PublishTemplateToMarketplaceCommand) {
    const pricing = resolveTemplateListingPricing(
      command.offerType,
      command.priceAmount,
      command.currency,
    );
    return this.uow.runInTransaction(async (context) => {
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
          'You do not have permission to publish this template',
        );
      if (template.getStatus() === TemplateStatus.ARCHIVED)
        throw new BadRequestException('Archived template cannot be published');
      let listing = await this.listings.findByTemplateId(
        template.getId(),
        context,
      );
      if (
        listing &&
        (listing.getOfferType() !== pricing.offerType ||
          !listing.getPrice().equals(pricing.price))
      ) {
        throw new BadRequestException(
          'Listing pricing does not match; update listing pricing before publishing',
        );
      }
      const version = await this.versions.findByIdForUpdate(
        command.versionId,
        context,
      );
      if (!version) throw new NotFoundException('Template version not found');
      if (version.getTemplateId() !== template.getId())
        throw new BadRequestException(
          'Template version does not belong to this template',
        );
      if (!version.isPublished())
        throw new BadRequestException('Template version must be published');
      const normalizedCategoryIds =
        command.categoryIds === undefined
          ? undefined
          : [...new Set(command.categoryIds.map((id) => id.toLowerCase()))];
      if (normalizedCategoryIds !== undefined) {
        const categories = await this.categories.findByIdsForShare(
          normalizedCategoryIds,
          context,
        );
        const foundIds = new Set(
          categories.map((category) => category.getId()),
        );
        if (normalizedCategoryIds.some((id) => !foundIds.has(id)))
          throw new BadRequestException(
            'One or more template categories do not exist',
          );
        if (categories.some((category) => !category.getIsActive()))
          throw new BadRequestException(
            'Only active template categories can be assigned',
          );
      }
      if (template.getVisibility() !== TemplateVisibility.PUBLIC) {
        template.updateMetadata({ visibility: TemplateVisibility.PUBLIC });
        await this.templates.save(template, context);
      }
      const effectiveDemoVersionId =
        command.demoVersionId !== undefined
          ? command.demoVersionId
          : listing?.getDemoVersionId();

      if (effectiveDemoVersionId) {
        const demoVersion = await this.versions.findById(
          effectiveDemoVersionId,
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
        if (demoVersion.getId() === version.getId()) {
          throw new BadRequestException(
            'Demo version cannot be the official release version',
          );
        }
      }

      let needsSave =
        !listing ||
        !listing.isPublished() ||
        listing.getPublishedVersionId() !== version.getId();
      if (!listing) {
        listing = TemplateListing.create({
          templateId: template.getId(),
          createdBy: command.userId,
          ...pricing,
          previewMode: command.previewMode,
          demoVersionId: command.demoVersionId,
          demoConfig: command.demoConfig,
        });
      } else {
        if (
          command.previewMode !== undefined &&
          listing.setPreviewMode(command.previewMode)
        ) {
          needsSave = true;
        }
        if (
          (command.demoVersionId !== undefined ||
            command.demoConfig !== undefined) &&
          listing.setDemoPreview(command.demoVersionId, command.demoConfig)
        ) {
          needsSave = true;
        }
      }
      listing.selectPublishedVersion(version);
      listing.publish();
      if (
        !(await this.releases.existsByTemplateAndVersion(
          template.getId(),
          version.getId(),
          context,
        ))
      ) {
        await this.releases.insertIfAbsent(
          TemplateMarketplaceRelease.create({
            templateId: template.getId(),
            versionId: version.getId(),
            releasedBy: command.userId,
            offerTypeAtRelease: listing.getOfferType(),
          }),
          context,
        );
      }
      if (needsSave) listing = await this.listings.save(listing, context);
      if (normalizedCategoryIds !== undefined) {
        await this.listings.replaceCategoryIds(
          listing.getId(),
          normalizedCategoryIds,
          context,
        );
      }
      const listingCategories = await this.listings.findCategoriesByTemplateIds(
        [listing.getTemplateId()],
        { activeOnly: false },
        context,
      );
      return {
        template: PageTemplateResponseDto.fromDomain(template),
        version: TemplateVersionResponseDto.fromDomain(version),
        listing: TemplateListingResponseDto.fromDomain(
          listing,
          listingCategories.get(listing.getTemplateId()) ?? [],
        ),
      };
    });
  }
}
