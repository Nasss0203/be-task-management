import { IsUUID, ValidateIf } from 'class-validator';

export class MoveDatabaseRowRequest {
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  previousRowId?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  nextRowId?: string | null;
}
