import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsIn,
} from 'class-validator';
import {
  TemplateStatus,
  TemplateVisibility,
} from 'src/common/enum/template.enum';

export class FindWorkspaceTemplatesDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus = TemplateStatus.PUBLISHED;

  @IsOptional()
  @IsEnum(TemplateVisibility)
  visibility?: TemplateVisibility;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ownedByMe?: boolean;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'name', 'updatedAt'])
  sortBy?: 'createdAt' | 'name' | 'updatedAt' = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
