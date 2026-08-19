import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageTemplateBlockRepository } from 'src/modules/content/domain/repositories/page-template-block.repository';
import { PageTemplateBlockResponseDto } from 'src/modules/content/application/dto/page-template/response/page-template-block.response.dto';

export class FindPageTemplateBlockByTemplateQuery {
  constructor(public readonly templateId: string) {}
}

@Injectable()
export class FindPageTemplateBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageTemplateBlockRepository)
    private readonly repo: PageTemplateBlockRepository,
  ) {}

  async execute(query: FindPageTemplateBlockByTemplateQuery): Promise<PageTemplateBlockResponseDto[]> {
    const blocks = await this.repo.findByTemplateId(query.templateId);
    return blocks.map((b) => PageTemplateBlockResponseDto.fromDomain(b));
  }
}
