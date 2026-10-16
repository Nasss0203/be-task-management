import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { TemplateEntitlement } from '../../../../domain/aggregates/template-entitlement/template-entitlement.aggregate';
import { TemplateListingStatus } from '../../../../domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';
import { TemplateStatus } from '../../../../../template/domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../../template/domain/enums/template-visibility.enum';
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import type { TemplateEntitlementRepository } from '../../../../domain/repositories/template-entitlement.repository';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import type { TemplateVersionPort } from 'src/modules/template/application/ports/template-content.port';
import { TEMPLATE_TYPES } from '../../../../../template/template.types';
import { TemplateEntitlementResponseDto } from '../../../dto/template-entitlement/template-entitlement.response.dto';
import { ClaimFreeTemplateCommand } from './claim-free-template.command';

@Injectable()
export class ClaimFreeTemplateHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly pageTemplateRepository: TemplateContentPort,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateListingRepository)
    private readonly templateListingRepository: TemplateListingRepository,

    @Inject(TEMPLATE_TYPES.ports.Versions)
    private readonly templateVersionRepository: TemplateVersionPort,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateEntitlementRepository)
    private readonly templateEntitlementRepository: TemplateEntitlementRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: ClaimFreeTemplateCommand,
  ): Promise<TemplateEntitlementResponseDto> {
    try {
      return await this.unitOfWork.runInTransaction(async (context) => {
        const existing =
          await this.templateEntitlementRepository.findByTemplateAndUser(
            command.templateId,
            command.userId,
            context,
          );

        if (existing) {
          return TemplateEntitlementResponseDto.fromDomain(existing);
        }

        // Serialize new claims with listing pricing changes before checking FREE.
        const template = await this.pageTemplateRepository.findByIdForUpdate(
          command.templateId,
          context,
        );

        if (
          !template ||
          template.getVisibility() !== TemplateVisibility.PUBLIC ||
          template.getStatus() === TemplateStatus.ARCHIVED
        ) {
          throw new NotFoundException('Template not found');
        }

        const listing = await this.templateListingRepository.findByTemplateId(
          command.templateId,
          context,
        );

        if (
          !listing ||
          listing.getStatus() !== TemplateListingStatus.PUBLISHED
        ) {
          throw new NotFoundException('Template not found');
        }

        if (listing.getOfferType() !== TemplateOfferType.FREE) {
          throw new BadRequestException('Template listing is not free');
        }

        const publishedVersion = listing.getPublishedVersionId()
          ? await this.templateVersionRepository.findById(
              listing.getPublishedVersionId()!,
              context,
            )
          : await this.templateVersionRepository.findPublishedByTemplateId(
              command.templateId,
              context,
            );

        if (
          !publishedVersion ||
          publishedVersion.isDraft() ||
          publishedVersion.getTemplateId() !== template.getId()
        ) {
          throw new NotFoundException('Template not found');
        }

        const entitlement = TemplateEntitlement.create({
          templateId: command.templateId,
          userId: command.userId,
        });
        const saved = await this.templateEntitlementRepository.create(
          entitlement,
          context,
        );

        return TemplateEntitlementResponseDto.fromDomain(saved);
      });
    } catch (error) {
      const databaseError = error as {
        code?: string;
        constraint?: string;
        driverError?: { code?: string; constraint?: string };
      } | null;
      const constraintError = databaseError?.driverError ?? databaseError;

      if (
        constraintError?.code === '23505' &&
        constraintError.constraint === 'UQ_template_entitlements_template_user'
      ) {
        // The failed transaction has rolled back; never reuse its context.
        const existing =
          await this.templateEntitlementRepository.findByTemplateAndUser(
            command.templateId,
            command.userId,
          );

        if (existing) {
          return TemplateEntitlementResponseDto.fromDomain(existing);
        }
      }

      throw error;
    }
  }
}
