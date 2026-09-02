import { IsOptional, IsUUID } from 'class-validator';

export class MovePageDto {
  @IsOptional()
  @IsUUID()
  parent_page_id?: string | null;

  @IsOptional()
  @IsUUID()
  teamspace_id?: string | null;
}
