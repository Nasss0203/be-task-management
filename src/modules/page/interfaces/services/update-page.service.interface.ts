import { EntityManager } from 'typeorm';
import { PageModel } from '../../domain/models/page.model';
import { UpdatePageDto } from '../../dto/update-page.dto';

export interface UpdatePageService {
  update(
    pageId: string,
    dto: UpdatePageDto,
    manager?: EntityManager,
  ): Promise<PageModel>;
}
