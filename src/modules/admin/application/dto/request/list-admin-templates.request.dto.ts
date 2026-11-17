import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  AdminTemplateOfferFilter,
  AdminTemplateStatusFilter,
} from '../../ports/admin-template-reader.port';

export class ListAdminTemplatesRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(AdminTemplateStatusFilter)
  status?: AdminTemplateStatusFilter;

  @IsOptional()
  @IsEnum(AdminTemplateOfferFilter)
  offerType?: AdminTemplateOfferFilter;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
