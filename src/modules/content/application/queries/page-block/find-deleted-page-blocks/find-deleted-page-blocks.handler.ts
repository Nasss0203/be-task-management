import { Inject, Injectable } from '@nestjs/common';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { FindDeletedPageBlocksQuery } from './find-deleted-page-blocks.query';

@Injectable()
export class FindDeletedPageBlocksHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
  ) {}

  async execute(
    query: FindDeletedPageBlocksQuery,
  ): Promise<PageBlockResponseDto[]> {
    const blocks = await this.pageBlockRepo.findDeletedByWorkspace(
      query.workspaceId,
      query.pageId,
    );
    return blocks.map((block) => PageBlockResponseDto.fromDomain(block));
  }
}
