import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';

export class AdminFindAllWorkspaceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PlanTypeWorkspace)
  plan?: PlanTypeWorkspace;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;
}

