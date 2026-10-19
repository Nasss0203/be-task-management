import { IsOptional, IsString, MaxLength } from 'class-validator';

import {
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_HEADLINE_LENGTH,
  MAX_LINK_LENGTH,
} from '../../../domain/entities/creator-profile.entity';

export class UpsertCreatorProfileRequest {
  @IsString()
  @MaxLength(30)
  handle: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_DISPLAY_NAME_LENGTH)
  display_name?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_HEADLINE_LENGTH)
  headline?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_BIO_LENGTH)
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_LINK_LENGTH)
  website?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_LINK_LENGTH)
  x?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_LINK_LENGTH)
  github?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_LINK_LENGTH)
  linkedin?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_LINK_LENGTH)
  youtube?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_LINK_LENGTH)
  facebook?: string | null;
}
