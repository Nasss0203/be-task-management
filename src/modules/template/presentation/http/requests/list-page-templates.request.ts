import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export enum TemplateListScope {
  MINE = 'mine',
  WORKSPACE = 'workspace',
  PUBLIC = 'public',
}

export class ListPageTemplatesRequest {
  @IsEnum(TemplateListScope)
  scope: TemplateListScope;

  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
