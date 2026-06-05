import { PageResponseDto } from '../../dto/response/page.response.dto';
import { CreatePageDto } from '../../dto/create-page.dto';

export interface CreatePageApplication {
  create(dto: CreatePageDto): Promise<PageResponseDto>;
}
