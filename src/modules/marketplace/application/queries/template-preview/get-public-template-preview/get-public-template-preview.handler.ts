import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import type { TemplateVersionPort } from 'src/modules/template/application/ports/template-content.port';
import { TEMPLATE_TYPES } from '../../../../../template/template.types';

import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';
import { TemplatePreviewMode } from '../../../../domain/enums/template-preview-mode.enum';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import { TemplatePreviewResponseDto } from '../../../../../template/application/dto/template-preview/template-preview.response.dto';
import { TemplatePreviewLoader } from '../../../../../template/application/services/template-preview-loader.service';
import { GetPublicTemplatePreviewQuery } from './get-public-template-preview.query';

@Injectable()
export class GetPublicTemplatePreviewHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly pageTemplateRepository: TemplateContentPort,

    @Inject(TEMPLATE_TYPES.ports.Versions)
    private readonly templateVersionRepository: TemplateVersionPort,

    private readonly templatePreviewLoader: TemplatePreviewLoader,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateListingRepository)
    private readonly templateListingRepository: TemplateListingRepository,
  ) {}

  async execute(
    query: GetPublicTemplatePreviewQuery,
  ): Promise<TemplatePreviewResponseDto> {
    const publicTemplate = await this.pageTemplateRepository.findPublicById(
      query.templateId,
    );
    if (!publicTemplate) {
      throw new NotFoundException('Template not found');
    }

    const listing = await this.templateListingRepository.findByTemplateId(
      query.templateId,
    );
    if (!listing) {
      throw new NotFoundException('Template listing not found');
    }

    if (
      !listing.isPublished() ||
      !listing.getPublishedVersionId() ||
      listing.getPublishedVersionId() !== publicTemplate.version.getId()
    ) {
      throw new NotFoundException('Template listing is not available');
    }

    if (listing.getPreviewMode() === TemplatePreviewMode.IMAGE) {
      throw new ForbiddenException(
        'Interactive preview is disabled for this template listing',
      );
    }

    const { template } = publicTemplate;
    let versionToPreview = publicTemplate.version;

    if (listing.getOfferType() === TemplateOfferType.PAID) {
      if (!listing.getDemoVersionId()) {
        throw new ForbiddenException(
          'Interactive demo preview is not configured for this paid template',
        );
      }

      const demoVersion = await this.templateVersionRepository.findById(
        listing.getDemoVersionId()!,
      );

      if (
        !demoVersion ||
        demoVersion.getTemplateId() !== query.templateId ||
        !demoVersion.isPublished() ||
        demoVersion.getId() === publicTemplate.version.getId() ||
        (listing.getPublishedVersionId() &&
          demoVersion.getId() === listing.getPublishedVersionId())
      ) {
        throw new ForbiddenException(
          'Interactive demo preview is not available for this paid template',
        );
      }

      if (
        query.versionId !== publicTemplate.version.getId() &&
        query.versionId !== demoVersion.getId()
      ) {
        throw new NotFoundException('Template version not found');
      }

      versionToPreview = demoVersion;
    } else {
      if (publicTemplate.version.getId() !== query.versionId) {
        throw new NotFoundException('Template version not found');
      }
    }

    const preview = await this.templatePreviewLoader.loadFrom(
      template,
      versionToPreview,
    );

    const isPaid = listing.getOfferType() === TemplateOfferType.PAID;
    preview.isDemo = isPaid;
    preview.interactive = true;
    preview.demoConfig = listing.getDemoConfig() ?? null;

    return preview;
  }
}
