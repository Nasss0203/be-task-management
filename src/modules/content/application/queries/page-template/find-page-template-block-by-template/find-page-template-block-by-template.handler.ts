import { Inject, Injectable } from '@nestjs/common';
import { PageTemplateBlockResponseDto } from 'src/modules/content/application/dto/page-template/response/page-template-block.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageTemplateBlockRepository } from 'src/modules/content/domain/repositories/page-template-block.repository';
import { FindPageTemplateBlockByTemplateQuery } from './find-page-template-block-by-template.query';

@Injectable()
export class FindPageTemplateBlockByTemplateHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageTemplateBlockRepository)
    private readonly repo: PageTemplateBlockRepository,
  ) {}

  async execute(
    query: FindPageTemplateBlockByTemplateQuery,
  ): Promise<PageTemplateBlockResponseDto[]> {
    const blocks = await this.repo.findByTemplateId(query.templateId);
    return blocks.map((block) =>
      PageTemplateBlockResponseDto.fromDomain(block),
    );
  }
}
