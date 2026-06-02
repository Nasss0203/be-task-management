import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;
}
