import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  NotificationSourceType,
  NotificationType,
} from '../../../domain/entities/notification.entity';

export class QueryNotificationDto {
  @IsOptional()
  @IsIn(['human', 'system'])
  category?: 'human' | 'system';

  @IsOptional()
  @IsBooleanString()
  unreadOnly?: string;

  @IsOptional()
  @IsIn(Object.values(NotificationSourceType))
  sourceType?: NotificationSourceType;

  @IsOptional()
  @IsIn(Object.values(NotificationType))
  type?: NotificationType;

  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  /** Legacy: createdAt of the last item of the previous page. Prefer cursorId. */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  cursor?: Date;

  /** id of the last item of the previous page (keyset pagination). */
  @IsOptional()
  @IsUUID()
  cursorId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
