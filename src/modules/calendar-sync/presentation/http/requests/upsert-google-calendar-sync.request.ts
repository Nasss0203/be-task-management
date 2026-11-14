import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpsertGoogleCalendarSyncRequest {
  @IsUUID()
  datePropertyId: string;

  @IsOptional()
  @IsBoolean()
  assignedToMeOnly?: boolean;
}
