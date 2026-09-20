import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';
import {
  NotificationSourceType,
  NotificationType,
} from '../../../domain/entities/notification.entity';

export class QueryNotificationDto {
  @IsOptional()
  @IsString()
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
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
