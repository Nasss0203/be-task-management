import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class CreatePageDto {
  @IsUUID()
  workspace_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  icon?: string | null;

  @IsOptional()
  @IsString()
  cover_url?: string | null;
}
