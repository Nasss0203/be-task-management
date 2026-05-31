import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../../domain/models/page_block.model';
import { ReorderPageBlockDto } from '../../dto/reorder-page_block.dto';
import { UpdatePageBlockDto } from '../../dto/update-page_block.dto';

export interface UpdatePageBlockService {
  update(
    updatePageBlockDto: UpdatePageBlockDto,
    manager?: EntityManager,
  ): Promise<PageBlockModel>;

  reorder(
    dto: ReorderPageBlockDto,
    manager?: EntityManager,
  ): Promise<PageBlockModel[]>;
}
