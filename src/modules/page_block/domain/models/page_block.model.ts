import { PageBlockType } from '../entities/page_block.entity';

export class PageBlockModel {
  constructor(
    public readonly id: string,
    public readonly page_id: string,
    public readonly type: PageBlockType,
    public readonly title: string,
    public readonly position_x: number,
    public readonly position_y: number,
    public readonly width: number,
    public readonly height: number,
    public readonly order_index: number,
    public readonly style_config: Record<string, any> | null,
    public readonly data_config: Record<string, any> | null,
    public readonly created_by: string,
    public readonly created_at: Date,
    public readonly updated_at: Date,
  ) {}
}
