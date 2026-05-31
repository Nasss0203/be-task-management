import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
import {
  PageBlockType,
  type PageBlockJson,
} from '../domain/entities/page_block.entity';

export class CreatePageBlockDto {
  @IsUUID()
  page_id: string;

  @IsEnum(PageBlockType)
  type: PageBlockType;

  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsInt()
  position_x?: number | null;

  @IsOptional()
  @IsInt()
  position_y?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  order_index?: number;

  @IsOptional()
  @IsUUID()
  insert_after_block_id?: string;

  @IsOptional()
  content?: PageBlockJson;

  @IsOptional()
  @IsObject()
  style_config?: Record<string, unknown> | null;

  @IsOptional()
  data_config?: PageBlockJson;

  @IsOptional()
  @IsUUID()
  created_by: string;

  @IsOptional()
  @IsBoolean()
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
