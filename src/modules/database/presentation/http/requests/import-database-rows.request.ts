import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ImportDatabaseRowsRequest {
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  mapping?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  dryRun?: string;
}
