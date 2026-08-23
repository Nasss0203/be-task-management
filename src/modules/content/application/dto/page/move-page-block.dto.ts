import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class MovePageBlockDto {
  @IsOptional()
  @IsUUID()
  target_parent_block_id?: string | null;

  @IsInt()
  @Min(0)
  target_order_index: number;
}
