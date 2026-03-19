import { PageBlockType } from '../../domain/entities/page_block.entity';

export class PageBlockResponseDto {
  id: string;
  page_id: string;
  type: PageBlockType;
  title: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  order_index: number;
  style_config: Record<string, any> | null;
  data_config: Record<string, any> | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
