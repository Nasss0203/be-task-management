import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  ADMIN_ACTIONS,
  ADMIN_ACTION_TARGET_TYPES,
  type AdminAction,
  type AdminActionTargetType,
} from '../../../domain/audit/admin-action';

export class ListAdminActionsRequestDto {
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
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsIn(ADMIN_ACTION_TARGET_TYPES)
  targetType?: AdminActionTargetType;

  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @IsIn(ADMIN_ACTIONS)
  action?: AdminAction;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
