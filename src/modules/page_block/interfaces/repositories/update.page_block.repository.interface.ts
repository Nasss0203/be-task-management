import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../../domain/models/page_block.model';

export type UpdatePageBlockInput = Pick<PageBlockModel, 'id'> &
  Partial<
    Pick<
      PageBlockModel,
      | 'title'
      | 'type'
      | 'position_x'
      | 'position_y'
      | 'width'
      | 'height'
      | 'order_index'
      | 'style_config'
      | 'data_config'
      | 'updated_at'
    >
  >;

export interface UpdatePageBlockRepository {
  save(
    pageBlock: UpdatePageBlockInput,
    manager: EntityManager,
  ): Promise<PageBlockModel>;
}
