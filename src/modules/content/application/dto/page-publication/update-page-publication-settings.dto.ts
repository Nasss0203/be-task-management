import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

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

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsUUID()
  logo_attachment_id?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsUUID()
  favicon_attachment_id?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'accent_color must be a hex color like #1a2b3c',
  })
  accent_color?: string | null;
}
