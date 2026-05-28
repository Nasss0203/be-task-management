import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  ActivityAction,
  ActivityEntityType,
} from '../domain/entities/activity.entity';

export class FindActivityQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(ActivityEntityType)
  entityType?: ActivityEntityType;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsEnum(ActivityAction)
  action?: ActivityAction;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
