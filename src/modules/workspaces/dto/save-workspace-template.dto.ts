import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { TemplateVisibility } from 'src/common/enum/template.enum';

export class SaveWorkspaceAsTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsEnum(TemplateVisibility)
  visibility: TemplateVisibility;

  @IsOptional()
  @IsBoolean()
  includeSampleTasks?: boolean;
}
