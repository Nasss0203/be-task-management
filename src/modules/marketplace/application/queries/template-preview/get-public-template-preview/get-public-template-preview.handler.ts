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
import {
  buildTemplateDemoPreview,
  resolvePaidDemoPreviewPlan,
  TemplateDemoPreviewUnavailableError,
} from '../../../services/template-demo-preview-policy';

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
    const officialVersion = publicTemplate.version;

    if (listing.getOfferType() !== TemplateOfferType.PAID) {
      if (officialVersion.getId() !== query.versionId) {
        throw new NotFoundException('Template version not found');
      }
      const preview = await this.templatePreviewLoader.loadFrom(
        template,
        officialVersion,
      );
      preview.isDemo = false;
      preview.interactive = true;
      preview.demoConfig = null;
      return preview;
    }

    const plan = toForbidden(() =>
      resolvePaidDemoPreviewPlan(listing, officialVersion.getId()),
    );
    const demoVersion =
      plan.demoVersionId === officialVersion.getId()
        ? officialVersion
        : await this.templateVersionRepository.findById(plan.demoVersionId);
    if (
      !demoVersion ||
      demoVersion.getTemplateId() !== query.templateId ||
      !demoVersion.isPublished()
    ) {
      throw new ForbiddenException(
        'Interactive demo preview is not available for this paid template',
      );
    }
    if (
      query.versionId !== officialVersion.getId() &&
      query.versionId !== demoVersion.getId()
    ) {
      throw new NotFoundException('Template version not found');
    }

    const preview = await this.templatePreviewLoader.loadFrom(
      template,
      demoVersion,
    );
    // LIMITED demos are filtered here, before anything leaves the server.
    return toForbidden(() => buildTemplateDemoPreview(preview, plan.config));
  }
}

function toForbidden<T>(run: () => T): T {
  try {
    return run();
  } catch (error) {
    if (error instanceof TemplateDemoPreviewUnavailableError) {
      throw new ForbiddenException(error.message);
    }
    throw error;
  }
}
