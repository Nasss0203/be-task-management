import { PageBlockResponseDto } from '../../dto/response/page_block.response.dto';

export interface FindPageBlockApplication {
  findAllByPageId(pageId: string): Promise<PageBlockResponseDto[]>;

  findDeletedPageBlocks(
    workspaceId: string,
    pageId?: string,
  ): Promise<PageBlockResponseDto[]>;
}
