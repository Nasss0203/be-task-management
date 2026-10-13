import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import type { TemplateVersionPort } from 'src/modules/template/application/ports/template-content.port';
import { TEMPLATE_TYPES } from '../../../../../template/template.types';

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
