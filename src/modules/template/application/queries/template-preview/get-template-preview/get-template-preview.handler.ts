import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { PageTemplateBlockResponseDto } from '../../../dto/template-block/page-template-block.response.dto';
import { TemplatePreviewResponseDto } from '../../../dto/template-preview/template-preview.response.dto';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';

import { GetTemplatePreviewQuery } from './get-template-preview.query';

@Injectable()
export class GetTemplatePreviewHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateBlockRepository)
    private readonly pageTemplateBlockRepository: PageTemplateBlockRepository,
  ) {}

  async execute(
    query: GetTemplatePreviewQuery,
  ): Promise<TemplatePreviewResponseDto> {
    const template = await this.pageTemplateRepository.findById(
      query.templateId,
    );

    if (!template) {
      throw new NotFoundException('Page template not found');
    }

    const version = await this.templateVersionRepository.findById(
      query.versionId,
    );

    if (!version) {
      throw new NotFoundException('Template version not found');
    }

    if (version.getTemplateId() !== template.getId()) {
      throw new BadRequestException(
        'Template version does not belong to this template',
      );
    }

    const blocks = await this.pageTemplateBlockRepository.findByVersionId(
      version.getId(),
    );

    return new TemplatePreviewResponseDto({
      template: PageTemplateResponseDto.fromDomain(template),

      version: TemplateVersionResponseDto.fromDomain(version),

      blocks: blocks.map((block) =>
        PageTemplateBlockResponseDto.fromDomain(block),
      ),
    });
  }
}
