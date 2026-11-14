import { IsUUID } from 'class-validator';

export class UpsertCalendarFeedRequest {
  @IsUUID()
  datePropertyId: string;
}
