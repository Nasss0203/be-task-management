import { Inject, Injectable } from '@nestjs/common';

import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { FindDeletedPageBlocksQuery } from './find-deleted-page-blocks.query';

@Injectable()
export class FindDeletedPageBlocksHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
  ) {}

  async execute(
    query: FindDeletedPageBlocksQuery,
  ): Promise<PageBlockResponseDto[]> {
    const [livePages, deletedPages] = await Promise.all([
      this.pageRepo.findAccessibleByWorkspace(query.workspaceId, query.userId),
      this.pageRepo.findAccessibleDeletedByWorkspace(
        query.workspaceId,
        query.userId,
      ),
    ]);
    const accessiblePageIds = new Set(
      [...livePages, ...deletedPages].map((page) => page.getId()),
    );

    if (query.pageId && !accessiblePageIds.has(query.pageId)) {
      return [];
    }

    const blocks = await this.pageBlockRepo.findDeletedByWorkspace(
      query.workspaceId,
      query.pageId,
    );

    return blocks
      .filter((block) => accessiblePageIds.has(block.getPageId()))
      .map((block) => PageBlockResponseDto.fromDomain(block));
  }
}
