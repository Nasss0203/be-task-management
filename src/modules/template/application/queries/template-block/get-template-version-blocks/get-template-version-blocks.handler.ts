import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { PageTemplateBlockResponseDto } from '../../../dto/template-block/page-template-block.response.dto';
import { GetTemplateVersionBlocksQuery } from './get-template-version-blocks.query';

@Injectable()
export class GetTemplateVersionBlocksHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateBlockRepository)
    private readonly pageTemplateBlockRepository: PageTemplateBlockRepository,
  ) {}

  async execute(
    query: GetTemplateVersionBlocksQuery,
  ): Promise<PageTemplateBlockResponseDto[]> {
    const version = await this.templateVersionRepository.findById(
      query.versionId,
    );

    if (!version) {
      throw new NotFoundException('Template version not found');
    }

    const blocks = await this.pageTemplateBlockRepository.findByVersionId(
      query.versionId,
    );

    return blocks.map((block) =>
      PageTemplateBlockResponseDto.fromDomain(block),
    );
  }
}
