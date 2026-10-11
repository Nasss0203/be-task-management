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
import type { PageTemplateRepository } from '../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../domain/repositories/template-version.repository';
import type { TemplateListingRepository } from '../../../domain/repositories/template-listing.repository';
import { TemplateListing } from '../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateStatus } from '../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../domain/enums/template-visibility.enum';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
import { TEMPLATE_TYPES } from '../../../template.types';
import { PageTemplateResponseDto } from '../../dto/page-template/page-template.response.dto';
import { TemplateVersionResponseDto } from '../../dto/template-version/template-version.response.dto';
import { TemplateListingResponseDto } from '../../dto/template-listing/template-listing.response.dto';
import { PublishTemplateToMarketplaceCommand } from './publish-template-to-marketplace.command';

@Injectable()
export class PublishTemplateToMarketplaceHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly templates: PageTemplateRepository,
    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly versions: TemplateVersionRepository,
    @Inject(TEMPLATE_TYPES.repositories.TemplateListingRepository)
    private readonly listings: TemplateListingRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork) private readonly uow: UnitOfWork,
    private readonly authorization: AuthorizationService,
  ) {}
  async execute(command: PublishTemplateToMarketplaceCommand) {
    if (command.offerType !== TemplateOfferType.FREE)
      throw new BadRequestException('Only FREE listings are supported');
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
      let version = await this.versions.findByIdForUpdate(
        command.versionId,
        context,
      );
      if (!version) throw new NotFoundException('Template version not found');
      if (version.getTemplateId() !== template.getId())
        throw new BadRequestException(
          'Template version does not belong to this template',
        );
      if (version.isDraft()) {
        version.publish();
        version = await this.versions.save(version, context);
      }
      if (template.getVisibility() !== TemplateVisibility.PUBLIC) {
        template.updateMetadata({ visibility: TemplateVisibility.PUBLIC });
        await this.templates.save(template, context);
      }
      let listing = await this.listings.findByTemplateId(
        template.getId(),
        context,
      );
      const needsSave =
        !listing ||
        !listing.isPublished() ||
        listing.getPublishedVersionId() !== version.getId();
      if (!listing)
        listing = TemplateListing.create({
          templateId: template.getId(),
          createdBy: command.userId,
          offerType: command.offerType,
        });
      if (listing.getOfferType() !== command.offerType)
        throw new BadRequestException('Listing offer type does not match');
      listing.selectPublishedVersion(version);
      listing.publish();
      if (needsSave) listing = await this.listings.save(listing, context);
      return {
        template: PageTemplateResponseDto.fromDomain(template),
        version: TemplateVersionResponseDto.fromDomain(version),
        listing: TemplateListingResponseDto.fromDomain(listing),
      };
    });
  }
}
