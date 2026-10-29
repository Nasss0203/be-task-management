import { IsUUID, ValidateIf } from 'class-validator';

export class ChangeDatabaseRowParentRequest {
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  parentRowId: string | null;
}
