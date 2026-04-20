import { PageBlockResponseDto } from '../../dto/response/page_block.response.dto';
import { UpdatePageBlockDto } from '../../dto/update-page_block.dto';

export interface UpdatePageBlockApplication {
  update(updatePageBlockDto: UpdatePageBlockDto): Promise<PageBlockResponseDto>;
}
