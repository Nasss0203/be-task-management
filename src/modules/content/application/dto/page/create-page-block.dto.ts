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
import type { PageBlockJson } from 'src/shared/domain/page-block.types';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

export class CreatePageBlockDto {
  @IsUUID()
  page_id: string;

  @IsOptional()
  @IsUUID()
  parent_block_id?: string | null;

  @IsOptional()
  @IsUUID()
  after_block_id?: string | null;

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
  content?: PageBlockJson;

  @IsOptional()
  @IsObject()
  style_config?: Record<string, unknown> | null;

  @IsOptional()
  data_config?: PageBlockJson;

  @IsOptional()
  @IsBoolean()
  is_open?: boolean;
}

export class AddDatabaseViewToBlockDto {
  @IsUUID()
  database_id: string;

  @IsUUID()
  view_id: string;
}
