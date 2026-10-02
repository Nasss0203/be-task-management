import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { GetPageTemplateQuery } from './get-page-template.query';

@Injectable()
export class GetPageTemplateHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,
  ) {}

  async execute(query: GetPageTemplateQuery): Promise<PageTemplateResponseDto> {
    const template = await this.pageTemplateRepository.findById(
      query.templateId,
    );

    if (!template) {
      throw new NotFoundException('Page template not found');
    }

    return PageTemplateResponseDto.fromDomain(template);
  }
}
