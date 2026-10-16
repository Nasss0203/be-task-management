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
import { TemplateVisibility } from '../../../../../template/domain/enums/template-visibility.enum';
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import type { TemplateMarketplaceReleaseRepository } from '../../../../domain/repositories/template-marketplace-release.repository';
import { TemplateMarketplaceRelease } from '../../../../domain/aggregates/template-marketplace-release/template-marketplace-release.aggregate';
import type { TemplateVersionPort } from 'src/modules/template/application/ports/template-content.port';
import { TEMPLATE_TYPES } from '../../../../../template/template.types';
import { TemplateListingResponseDto } from '../../../dto/template-listing/template-listing.response.dto';
import { PublishTemplateListingCommand } from './publish-template-listing.command';

@Injectable()
export class PublishTemplateListingHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly pageTemplateRepository: TemplateContentPort,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateListingRepository)
    private readonly templateListingRepository: TemplateListingRepository,

    @Inject(TEMPLATE_TYPES.ports.Versions)
    private readonly templateVersionRepository: TemplateVersionPort,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateMarketplaceReleaseRepository)
    private readonly releases: TemplateMarketplaceReleaseRepository,
  ) {}

  async execute(
    command: PublishTemplateListingCommand,
  ): Promise<TemplateListingResponseDto> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const template = await this.pageTemplateRepository.findByIdForUpdate(
        command.templateId,
        context,
      );

      if (!template) {
        throw new NotFoundException('Page template not found');
      }

      if (template.getStatus() === TemplateStatus.ARCHIVED) {
        throw new BadRequestException(
          'Archived template cannot publish a listing',
        );
      }

      const isCreator = template.getCreatedBy() === command.userId;
      const isOwner = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.WORKSPACE_UPDATE],
        target: { type: 'workspace', id: template.getWorkspaceId() },
      });

      if (!isCreator && !isOwner) {
        throw new ForbiddenException(
          'You do not have permission to publish a listing for this template',
        );
      }

      const listing = await this.templateListingRepository.findByTemplateId(
        command.templateId,
        context,
      );

      if (!listing) {
        throw new NotFoundException('Template listing not found');
      }

      if (template.getVisibility() !== TemplateVisibility.PUBLIC) {
        throw new BadRequestException(
          'Template must be public before publishing marketplace listing',
        );
      }

      const selectedId = listing.getPublishedVersionId();
      if (!selectedId) {
        throw new BadRequestException(
          'Select an official template version before publishing the listing',
        );
      }
      const publishedVersion =
        await this.templateVersionRepository.findByIdForUpdate(
          selectedId,
          context,
        );

      if (
        !publishedVersion ||
        !publishedVersion.isPublished() ||
        publishedVersion.getTemplateId() !== template.getId()
      ) {
        throw new BadRequestException(
          'Template must have a published version before publishing marketplace listing',
        );
      }

      if (listing.getDemoVersionId() === publishedVersion.getId()) {
        throw new BadRequestException(
          'Demo version cannot be the official release version',
        );
      }

      listing.selectPublishedVersion(publishedVersion);
      listing.publish();

      if (
        !(await this.releases.existsByTemplateAndVersion(
          template.getId(),
          publishedVersion.getId(),
          context,
        ))
      ) {
        await this.releases.insertIfAbsent(
          TemplateMarketplaceRelease.create({
            templateId: template.getId(),
            versionId: publishedVersion.getId(),
            releasedBy: command.userId,
            offerTypeAtRelease: listing.getOfferType(),
          }),
          context,
        );
      }

      const savedListing = await this.templateListingRepository.save(
        listing,
        context,
      );

      const listingCategories =
        await this.templateListingRepository.findCategoriesByTemplateIds(
          [savedListing.getTemplateId()],
          { activeOnly: false },
          context,
        );
      return TemplateListingResponseDto.fromDomain(
        savedListing,
        listingCategories.get(savedListing.getTemplateId()) ?? [],
      );
    });
  }
}
