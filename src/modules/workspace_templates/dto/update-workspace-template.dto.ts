import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TemplateVisibility } from 'src/common/enum/template.enum';

export class UpdateWorkspaceTemplateDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsEnum(TemplateVisibility)
  @IsOptional()
  visibility?: TemplateVisibility;
}
