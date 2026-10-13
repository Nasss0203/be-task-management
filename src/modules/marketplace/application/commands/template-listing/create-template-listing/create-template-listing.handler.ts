import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { TemplateOfferType } from 'src/modules/marketplace/domain/enums/template-offer-type.enum';
import { TemplatePrice } from 'src/modules/marketplace/domain/value-objects/template-price.vo';
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import { TemplateStatus } from '../../../../../template/domain/enums/template-status.enum';
import { TEMPLATE_TYPES } from '../../../../../template/template.types';
import { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import { TemplateListingResponseDto } from '../../../dto/template-listing/template-listing.response.dto';
import { CreateTemplateListingCommand } from './create-template-listing.command';

@Injectable()
export class CreateTemplateListingHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly pageTemplateRepository: TemplateContentPort,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateListingRepository)
    private readonly templateListingRepository: TemplateListingRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    command: CreateTemplateListingCommand,
  ): Promise<TemplateListingResponseDto> {
    try {
      return await this.unitOfWork.runInTransaction(async (context) => {
        const template = await this.pageTemplateRepository.findByIdForUpdate(
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

        const offerType = command.offerType ?? TemplateOfferType.FREE;

        if (
          offerType === TemplateOfferType.PAID &&
          (command.priceAmount === undefined || command.currency === undefined)
        ) {
          throw new BadRequestException(
            'PAID listing requires price_amount and currency',
          );
        }

        let listing: TemplateListing;

        try {
          const price = TemplatePrice.create({
            amount: command.priceAmount ?? 0,
            currency: command.currency ?? 'VND',
          });

          listing = TemplateListing.create({
            templateId: template.getId(),
            createdBy: command.userId,
            offerType,
            price,
          });
        } catch (error) {
          throw new BadRequestException(
            error instanceof Error ? error.message : 'Invalid template pricing',
          );
        }
        const savedListing = await this.templateListingRepository.create(
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
