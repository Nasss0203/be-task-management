import { IsEnum, IsOptional } from 'class-validator';

export enum WorkspaceGrowthPeriod {
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_60_DAYS = '60d',
  LAST_1_YEAR = '1y',
}

export class WorkspaceGrowthQueryDto {
  @IsOptional()
  @IsEnum(WorkspaceGrowthPeriod)
  period?: WorkspaceGrowthPeriod = WorkspaceGrowthPeriod.LAST_7_DAYS;
}
