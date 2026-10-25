import { IsUUID, ValidateIf } from 'class-validator';

export class SetViewGroupRequest {
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  propertyId: string | null;
}
