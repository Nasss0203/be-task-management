import { Inject, Injectable } from '@nestjs/common';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { FindPageBlockByRowQuery } from './find-page-block-by-row.query';

@Injectable()
export class FindPageBlockByRowHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
  ) {}

  async execute(
    query: FindPageBlockByRowQuery,
  ): Promise<PageBlockResponseDto[]> {
    const blocks = await this.pageBlockRepo.findByRowId(query.rowId);
    return blocks.map((block) => PageBlockResponseDto.fromDomain(block));
  }
}
