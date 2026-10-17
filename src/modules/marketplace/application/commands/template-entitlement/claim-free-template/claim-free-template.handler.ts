import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { Inject, Injectable } from '@nestjs/common';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import type { TemplateEntitlementRepository } from '../../../../domain/repositories/template-entitlement.repository';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import type { TemplateVersionPort } from 'src/modules/template/application/ports/template-content.port';
import { TEMPLATE_TYPES } from '../../../../../template/template.types';
import { TemplateEntitlementResponseDto } from '../../../dto/template-entitlement/template-entitlement.response.dto';
import {
  FreeTemplateClaimService,
  isDuplicateEntitlementError,
} from '../../../services/free-template-claim.service';
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
  ) {
    // Built from the injected dependencies so the constructor (and DI) stay as they were.
    this.claims = new FreeTemplateClaimService(
      pageTemplateRepository,
      templateListingRepository,
      templateVersionRepository,
      templateEntitlementRepository,
    );
  }

  private readonly claims: FreeTemplateClaimService;

  async execute(
    command: ClaimFreeTemplateCommand,
  ): Promise<TemplateEntitlementResponseDto> {
    try {
      return await this.unitOfWork.runInTransaction(async (context) =>
        TemplateEntitlementResponseDto.fromDomain(
          await this.claims.claim(command.templateId, command.userId, context),
        ),
      );
    } catch (error) {
      if (isDuplicateEntitlementError(error)) {
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
