import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
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
    const template = await this.pageTemplateRepository.findById(
      query.templateId,
    );

    if (!template) {
      throw new NotFoundException('Page template not found');
    }

    /*
     * Public preview chỉ cho PUBLIC template.
     *
     * Dùng 404 thay vì Forbidden để không expose
     * sự tồn tại của PRIVATE / WORKSPACE template.
     */
    if (template.getVisibility() !== TemplateVisibility.PUBLIC) {
      throw new NotFoundException('Page template not found');
    }

    const version = await this.templateVersionRepository.findById(
      query.versionId,
    );

    if (!version) {
      throw new NotFoundException('Template version not found');
    }

    /*
     * Không cho dùng version của template khác.
     */
    if (version.getTemplateId() !== template.getId()) {
      throw new NotFoundException('Template version not found');
    }

    /*
     * Public tuyệt đối không được đọc DRAFT.
     *
     * Source hiện tại đã có version.isDraft(),
     * nên reuse method thật thay vì đoán enum/getter khác.
     */
    if (version.isDraft()) {
      throw new NotFoundException('Template version not found');
    }

    return this.templatePreviewLoader.loadFrom(template, version);
  }
}
