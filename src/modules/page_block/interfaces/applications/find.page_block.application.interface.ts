import { PageBlockResponseDto } from '../../dto/response/page_block.response.dto';

export interface FindPageBlockApplication {
  findDeletedPageBlocks(
    workspaceId: string,
    pageId?: string,
  ): Promise<PageBlockResponseDto[]>;
}
