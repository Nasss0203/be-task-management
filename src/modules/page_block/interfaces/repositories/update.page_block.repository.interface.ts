import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../../domain/models/page_block.model';
import { ReorderPageBlockItemDto } from '../../dto/reorder-page_block.dto';

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
      | 'content'
      | 'style_config'
      | 'data_config'
      | 'is_open'
      | 'updated_at'
    >
  >;

export interface UpdatePageBlockRepository {
  save(
    pageBlock: UpdatePageBlockInput,
    manager?: EntityManager,
  ): Promise<PageBlockModel>;

  reorder(
    pageId: string,
    items: ReorderPageBlockItemDto[],
    manager?: EntityManager,
  ): Promise<PageBlockModel[]>;
}
