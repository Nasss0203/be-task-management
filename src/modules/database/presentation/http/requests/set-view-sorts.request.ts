import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import {
  MAX_DATABASE_VIEW_SORTS,
  type DatabaseViewSortDirection,
} from '../../../domain/aggregates/view/database-view.aggregate';

export class DatabaseViewSortRequest {
  @IsUUID()
  propertyId: string;

  @IsIn(['asc', 'desc'])
  direction: DatabaseViewSortDirection;
}

export class SetViewSortsRequest {
  @IsArray()
  @ArrayMaxSize(MAX_DATABASE_VIEW_SORTS)
  @ValidateNested({ each: true })
  @Type(() => DatabaseViewSortRequest)
  sorts: DatabaseViewSortRequest[];
}
