import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderPageBlockItemDto)
  items: ReorderPageBlockItemDto[];
}
