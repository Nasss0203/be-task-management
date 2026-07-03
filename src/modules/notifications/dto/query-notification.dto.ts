import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  NotificationSourceType,
  NotificationType,
} from '../domain/entities/notification.entity';

export class QueryNotificationDto {
  @IsOptional()
  @IsString()
  category?: 'human' | 'system';

  @IsOptional()
  @IsBooleanString()
  unreadOnly?: string;

  @IsOptional()
  @IsEnum(NotificationSourceType)
  sourceType?: NotificationSourceType;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
