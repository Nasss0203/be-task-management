import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';

export enum AdminWorkspaceStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

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
}
