import { IsEnum, IsOptional } from 'class-validator';

export enum UserGrowthPeriod {
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_60_DAYS = '60d',
  LAST_1_YEAR = '1y',
}

export enum UserGrowthGroupBy {
  DAY = 'day',
  MONTH = 'month',
}

export class UserGrowthQueryDto {
  @IsOptional()
  @IsEnum(UserGrowthPeriod)
  period?: UserGrowthPeriod = UserGrowthPeriod.LAST_7_DAYS;

  @IsOptional()
  @IsEnum(UserGrowthGroupBy)
  groupBy?: UserGrowthGroupBy;
}
