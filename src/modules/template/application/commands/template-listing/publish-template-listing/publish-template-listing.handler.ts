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

import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { TemplateListingResponseDto } from '../../../dto/template-listing/template-listing.response.dto';
import { PublishTemplateListingCommand } from './publish-template-listing.command';

@Injectable()
export class PublishTemplateListingHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateListingRepository)
    private readonly templateListingRepository: TemplateListingRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
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
      const publishedVersion = selectedId
        ? await this.templateVersionRepository.findById(selectedId, context)
        : await this.templateVersionRepository.findPublishedByTemplateId(
            command.templateId,
            context,
          );

      if (
        !publishedVersion ||
        publishedVersion.isDraft() ||
        publishedVersion.getTemplateId() !== template.getId()
      ) {
        throw new BadRequestException(
          'Template must have a published version before publishing marketplace listing',
        );
      }

      listing.selectPublishedVersion(publishedVersion);
      listing.publish();

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
