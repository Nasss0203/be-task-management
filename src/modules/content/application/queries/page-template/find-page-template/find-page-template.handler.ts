import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PageTemplateResponseDto } from 'src/modules/content/application/dto/page-template/response/page-template.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageTemplateRepository } from 'src/modules/content/domain/repositories/page-template.repository';
import { FindPageTemplateQuery } from './find-page-template.query';

@Injectable()
export class FindPageTemplateHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageTemplateRepository)
    private readonly repo: PageTemplateRepository,
  ) {}

  async execute(
    query: FindPageTemplateQuery,
  ): Promise<PageTemplateResponseDto> {
    const template = await this.repo.findById(query.id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return PageTemplateResponseDto.fromDomain(template);
  }
}
