import { PageBlockResponseDto } from '../../dto/response/page_block.response.dto';
import { ReorderPageBlockDto } from '../../dto/reorder-page_block.dto';
import { UpdatePageBlockDto } from '../../dto/update-page_block.dto';

export interface UpdatePageBlockApplication {
  update(updatePageBlockDto: UpdatePageBlockDto): Promise<PageBlockResponseDto>;

  reorder(dto: ReorderPageBlockDto): Promise<PageBlockResponseDto[]>;
}
