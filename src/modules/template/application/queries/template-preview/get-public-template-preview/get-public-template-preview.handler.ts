import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { TemplatePreviewResponseDto } from '../../../dto/template-preview/template-preview.response.dto';
import { TemplatePreviewLoader } from '../../../services/template-preview-loader.service';
import { GetPublicTemplatePreviewQuery } from './get-public-template-preview.query';

@Injectable()
export class GetPublicTemplatePreviewHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    private readonly templatePreviewLoader: TemplatePreviewLoader,
  ) {}

  async execute(
    query: GetPublicTemplatePreviewQuery,
  ): Promise<TemplatePreviewResponseDto> {
    const publicTemplate = await this.pageTemplateRepository.findPublicById(
      query.templateId,
    );
    if (!publicTemplate || publicTemplate.version.getId() !== query.versionId) {
      throw new NotFoundException('Template version not found');
    }
    const { template, version } = publicTemplate;

    return this.templatePreviewLoader.loadFrom(template, version);
  }
}
