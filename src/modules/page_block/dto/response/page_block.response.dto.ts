import {
  PageBlockJson,
  PageBlockType,
} from '../../domain/entities/page_block.entity';

export class PageBlockResponseDto {
  id: string;
  page_id: string;
  type: PageBlockType;
  title: string | null;
  position_x: number | null;
  position_y: number | null;
  width: number | null;
  height: number | null;
  order_index: number;
  content: PageBlockJson;
  style_config: Record<string, unknown> | null;
  data_config: PageBlockJson;
  created_by: string;
  is_open: boolean;
  created_at: Date;
  updated_at: Date;

  deleted_at: Date | null;
  deleted_by: string | null;
}
