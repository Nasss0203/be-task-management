import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export const SEO_TITLE_MAX_LENGTH = 70;
export const SEO_DESCRIPTION_MAX_LENGTH = 200;

export class UpdatePagePublicationSettingsDto {
  @IsOptional()
  @IsBoolean()
  include_descendants?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_updates?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(SEO_TITLE_MAX_LENGTH)
  seo_title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(SEO_DESCRIPTION_MAX_LENGTH)
  seo_description?: string | null;

  @IsOptional()
  @IsBoolean()
  search_indexing?: boolean;
}
