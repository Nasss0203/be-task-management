import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { GetPublicTemplateDetailQuery } from './get-public-template-detail.query';

@Injectable()
export class GetPublicTemplateDetailHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,
  ) {}

  async execute(query: GetPublicTemplateDetailQuery) {
    const result = await this.pageTemplateRepository.findPublicById(
      query.templateId,
    );

    if (!result) {
      throw new NotFoundException('Template not found');
    }

    return {
      ...PageTemplateResponseDto.fromDomain(result.template),
      version: TemplateVersionResponseDto.fromDomain(result.version),
    };
  }
}
