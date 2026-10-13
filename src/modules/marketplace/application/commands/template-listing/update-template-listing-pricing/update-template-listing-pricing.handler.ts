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
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import { TEMPLATE_TYPES } from '../../../../../template/template.types';
import { TemplateListingResponseDto } from '../../../dto/template-listing/template-listing.response.dto';
import { resolveTemplateListingPricing } from '../../../services/template-listing-pricing';
import { UpdateTemplateListingPricingCommand } from './update-template-listing-pricing.command';

@Injectable()
export class UpdateTemplateListingPricingHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templates: TemplateContentPort,
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
      const { offerType, price } = resolveTemplateListingPricing(
        command.offerType,
        command.priceAmount,
        command.currency,
      );
      if (listing.configureOffer(offerType, price)) {
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
