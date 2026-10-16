import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import type { TemplateListingRepository } from 'src/modules/marketplace/domain/repositories/template-listing.repository';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import { TemplateListingResponseDto } from '../../../dto/template-listing/template-listing.response.dto';
import { GetTemplateListingQuery } from './get-template-listing.query';

@Injectable()
export class GetTemplateListingHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly pageTemplateRepository: TemplateContentPort,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateListingRepository)
    private readonly templateListingRepository: TemplateListingRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: GetTemplateListingQuery,
  ): Promise<TemplateListingResponseDto> {
    const template = await this.pageTemplateRepository.findById(
      query.templateId,
    );

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const isCreator = template.getCreatedBy() === query.userId;

    const canManageWorkspace = isCreator
      ? true
      : await this.authorizationService.authorize({
          userId: query.userId,
          permissions: [PERMISSIONS.WORKSPACE_UPDATE],
          target: {
            type: 'workspace',
            id: template.getWorkspaceId(),
          },
        });

    if (!isCreator && !canManageWorkspace) {
      throw new ForbiddenException(
        'You do not have permission to manage this template',
      );
    }

    const listing = await this.templateListingRepository.findByTemplateId(
      query.templateId,
    );

    if (!listing) {
      throw new NotFoundException('Template listing not found');
    }

    const listingCategories =
      await this.templateListingRepository.findCategoriesByTemplateIds(
        [listing.getTemplateId()],
        { activeOnly: false },
      );
    return TemplateListingResponseDto.fromDomain(
      listing,
      listingCategories.get(listing.getTemplateId()) ?? [],
    );
  }
}
