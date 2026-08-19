import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';

export class FindPageBlockByPageQuery {
  constructor(public readonly pageId: string) {}
}

export class FindDeletedPageBlocksQuery {
  constructor(public readonly workspaceId: string, public readonly pageId?: string) {}
}

@Injectable()
export class FindPageBlockHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
  ) {}

  async findAllByPageId(query: FindPageBlockByPageQuery): Promise<PageBlockResponseDto[]> {
    const blocks = await this.pageBlockRepo.findByPageId(query.pageId);
    return blocks.map((b) => PageBlockResponseDto.fromDomain(b));
  }

  async findDeletedPageBlocks(query: FindDeletedPageBlocksQuery): Promise<PageBlockResponseDto[]> {
    const blocks = await this.pageBlockRepo.findDeletedByWorkspace(query.workspaceId, query.pageId);
    return blocks.map((b) => PageBlockResponseDto.fromDomain(b));
  }
}
