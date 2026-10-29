import {
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderPageBlockItemDto {
  @IsUUID()
  id: string;

  @IsInt()
  @Min(0)
  order_index: number;
}

export class ReorderPageBlockDto {
  @IsUUID()
  page_id: string;

  @IsOptional()
  @IsUUID()
  parent_block_id?: string | null;

  /** Reorders inside this task's content instead of the page's. */
  @IsOptional()
  @IsUUID()
  row_id?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderPageBlockItemDto)
  items: ReorderPageBlockItemDto[];
}
