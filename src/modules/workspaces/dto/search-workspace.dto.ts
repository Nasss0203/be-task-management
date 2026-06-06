import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';

export enum AdminWorkspaceStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

const toNumber = ({ value }: TransformFnParams): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
};

export class AdminFindAllWorkspaceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PlanTypeWorkspace)
  plan?: PlanTypeWorkspace;

  @IsOptional()
  @IsEnum(AdminWorkspaceStatus)
  status?: AdminWorkspaceStatus;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
