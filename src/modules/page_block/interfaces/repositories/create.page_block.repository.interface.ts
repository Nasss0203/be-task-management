import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../../domain/models/page_block.model';

export type SavePageBlockInput = Pick<
  PageBlockModel,
  'page_id' | 'type' | 'created_by'
> &
  Partial<
    Pick<
      PageBlockModel,
      | 'title'
      | 'position_x'
      | 'position_y'
      | 'width'
      | 'height'
      | 'order_index'
      | 'content'
      | 'style_config'
      | 'data_config'
      | 'id'
      | 'created_at'
      | 'updated_at'
    >
  >;

export interface CreatePageBlockRepository {
  save(
    page: PageBlockModel | SavePageBlockInput,
    manager: EntityManager,
  ): Promise<PageBlockModel>;
}
