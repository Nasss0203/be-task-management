import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { TemplateVisibility } from '../../../domain/enums/template-visibility.enum';

export class CreatePageTemplateRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  icon?: string | null;

  @IsOptional()
  @IsString()
  cover_url?: string | null;

  @IsOptional()
  @IsEnum(TemplateVisibility)
  visibility?: TemplateVisibility;
}
