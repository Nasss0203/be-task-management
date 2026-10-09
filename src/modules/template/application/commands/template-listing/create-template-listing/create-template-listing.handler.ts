import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { CreateTemplateListingCommand } from './create-template-listing.command';

@Injectable()
export class CreateTemplateListingHandler {
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
    command: CreateTemplateListingCommand,
  ): Promise<TemplateListing> {
    try {
      return await this.unitOfWork.runInTransaction(async (context) => {
        const template = await this.pageTemplateRepository.findById(
          command.templateId,
          context,
        );

        if (!template) {
          throw new NotFoundException('Page template not found');
        }

        if (template.getStatus() === TemplateStatus.ARCHIVED) {
          throw new BadRequestException(
            'Archived template cannot create a listing',
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
            'You do not have permission to create a listing for this template',
          );
        }

        const existingListing =
          await this.templateListingRepository.findByTemplateId(
            template.getId(),
            context,
          );

        if (existingListing) {
          throw new ConflictException('Template listing already exists');
        }

        const listing = TemplateListing.create({
          templateId: template.getId(),
          createdBy: command.userId,
        });

        return this.templateListingRepository.create(listing, context);
      });
    } catch (error) {
      const constraintError = error as {
        driverError?: { code?: string; constraint?: string };
      };
      if (
        constraintError.driverError?.code === '23505' &&
        constraintError.driverError.constraint ===
          'UQ_template_listings_template_id'
      ) {
        throw new ConflictException('Template listing already exists');
      }
      throw error;
    }
  }
}
