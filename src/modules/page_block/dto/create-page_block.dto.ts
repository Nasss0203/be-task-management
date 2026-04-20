import { IsEnum, IsUUID } from 'class-validator';
import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
import {
  PageBlockJson,
  PageBlockType,
} from '../domain/entities/page_block.entity';

export class CreatePageBlockDto {
  page_id: string;
  type: PageBlockType;
  title?: string | null;
  position_x?: number | null;
  position_y?: number | null;
  width?: number | null;
  height?: number | null;
  order_index?: number;
  content?: PageBlockJson;
  style_config?: Record<string, unknown> | null;
  data_config?: PageBlockJson;
  created_by: string;
  is_open?: boolean;
}

export class AddDatabaseViewToBlockDto {
  @IsUUID()
  board_id: string;

  @IsUUID()
  workspace_id: string;

  @IsUUID()
  project_id: string;

  @IsEnum(BoardViewType)
  view_type: BoardViewType;
}
