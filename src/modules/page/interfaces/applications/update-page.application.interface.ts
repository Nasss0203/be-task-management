import { PageResponseDto } from '../../dto/response/page.response.dto';
import { UpdatePageDto } from '../../dto/update-page.dto';

export interface UpdatePageApplication {
  update(pageId: string, dto: UpdatePageDto): Promise<PageResponseDto>;
}
