import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class CreatePageDto {
  @IsUUID()
  workspace_id: string;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  icon?: string | null;

  @IsOptional()
  @IsString()
  cover_url?: string | null;

  @IsOptional()
  is_template?: boolean;

  @IsOptional()
  @IsUUID()
  created_by: string;

  blocks?: PageBlock[];
}
