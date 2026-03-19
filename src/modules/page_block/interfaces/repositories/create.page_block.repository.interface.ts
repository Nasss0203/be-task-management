import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../../domain/models/page_block.model';

export type SavePageBlockInput = Pick<
  PageBlockModel,
  | 'page_id'
  | 'data_config'
  | 'style_config'
  | 'height'
  | 'order_index'
  | 'position_x'
  | 'position_y'
  | 'title'
  | 'type'
  | 'width'
  | 'created_by'
> &
  Partial<Pick<PageBlockModel, 'created_at' | 'id' | 'updated_at'>>;

export interface CreatePageBlockRepository {
  save(
    page: PageBlockModel | SavePageBlockInput,
    manager: EntityManager,
  ): Promise<PageBlockModel>;
}
