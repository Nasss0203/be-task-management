import { PageBlockJson, PageBlockType } from '../entities/page_block.entity';

export class PageBlockModel {
  constructor(
    public readonly id: string,
    public readonly page_id: string,
    public readonly type: PageBlockType,
    public readonly title: string | null,
    public readonly position_x: number | null,
    public readonly position_y: number | null,
    public readonly width: number | null,
    public readonly height: number | null,
    public readonly order_index: number,
    public readonly content: PageBlockJson,
    public readonly style_config: Record<string, unknown> | null,
    public readonly data_config: PageBlockJson,
    public readonly created_by: string,
    public readonly is_open: boolean,
    public readonly created_at: Date,
    public readonly updated_at: Date,

    public readonly deleted_at: Date | null = null,
    public readonly deleted_by: string | null = null,
  ) {}
}
