import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { PageTemplateRepository } from 'src/modules/template/domain/repositories/page-template.repository';
import type { TemplateListingRepository } from 'src/modules/template/domain/repositories/template-listing.repository';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { TemplateListingResponseDto } from '../../../dto/template-listing/template-listing.response.dto';
import { UnpublishTemplateListingCommand } from './unpublish-template-listing.command';

@Injectable()
export class UnpublishTemplateListingHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateListingRepository)
    private readonly templateListingRepository: TemplateListingRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    command: UnpublishTemplateListingCommand,
  ): Promise<TemplateListingResponseDto> {
    return this.unitOfWork.runInTransaction(async (context) => {
      // 1. Load template
      const template = await this.pageTemplateRepository.findByIdForUpdate(
        command.templateId,
        context,
      );

      if (!template) {
        throw new NotFoundException('Template not found');
      }

      // 2. Authorization
      const canManageWorkspace = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.WORKSPACE_UPDATE],
        target: {
          type: 'workspace',
          id: template.getWorkspaceId(),
        },
      });

      const isCreator = template.getCreatedBy() === command.userId;

      if (!isCreator && !canManageWorkspace) {
        throw new ForbiddenException(
          'You do not have permission to manage this template',
        );
      }

      // 3. Load listing
      const listing = await this.templateListingRepository.findByTemplateId(
        command.templateId,
        context,
      );

      if (!listing) {
        throw new NotFoundException('Template listing not found');
      }

      // 4. PUBLISHED -> DRAFT
      listing.unpublish();

      // 5. Persist
      const savedListing = await this.templateListingRepository.save(
        listing,
        context,
      );

      // 6. Return DTO
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
