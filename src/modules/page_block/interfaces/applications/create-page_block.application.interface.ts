import { AddDatabaseViewToBlockDto } from '../../dto/create-page_block.dto';
import { PageBlockResponseDto } from '../../dto/response/page_block.response.dto';

export interface CreatePageBlockApplication {
  addDatabaseViewToBlock(
    blockId: string,
    newView: AddDatabaseViewToBlockDto,
  ): Promise<PageBlockResponseDto>;
}
