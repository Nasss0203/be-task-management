import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePageDto {
  @IsUUID()
  workspace_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsUUID()
  teamspace_id?: string | null;

  @IsOptional()
  @IsString()
  icon?: string | null;

  @IsOptional()
  @IsString()
  cover_url?: string | null;
}
