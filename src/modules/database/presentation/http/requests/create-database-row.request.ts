import { IsUUID, ValidateIf } from 'class-validator';

export class CreateDatabaseRowRequest {
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  parentRowId?: string | null;
}
