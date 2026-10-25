import { Type } from 'class-transformer';
import {
  Allow,
  ArrayMaxSize,
  IsArray,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { MAX_DATABASE_VIEW_FILTERS } from '../../../domain/constants/database-view-filter.constant';

export class DatabaseViewFilterRequest {
  @IsUUID()
  propertyId: string;

  @IsString()
  @MaxLength(30)
  operator: string;

  @Allow()
  value?: string | number | null;
}

export class SetViewFiltersRequest {
  @IsArray()
  @ArrayMaxSize(MAX_DATABASE_VIEW_FILTERS)
  @ValidateNested({ each: true })
  @Type(() => DatabaseViewFilterRequest)
  filters: DatabaseViewFilterRequest[];
}
