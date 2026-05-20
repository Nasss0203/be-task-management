// src/modules/notifications/applications/create-notification.application.impl.ts

import { Inject, Injectable } from '@nestjs/common';
import { NotificationResponseDto } from '../dto/response/notification.response.dto';
import {
  CreateNotificationApplication,
  CreateNotificationApplicationInput,
} from '../interfaces/applications/create.notifications.application.interface';
import { type CreateNotificationService } from '../interfaces/services/create.notifications.service.interface';
import { NOTIFICATION_TYPES } from '../interfaces/types';
import { NotificationMapper } from '../mapper/notifications.mapper';

@Injectable()
export class CreateNotificationApplicationImpl implements CreateNotificationApplication {
  constructor(
    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly createNotificationService: CreateNotificationService,
  ) {}

  async createNotification(
    input: CreateNotificationApplicationInput,
  ): Promise<NotificationResponseDto> {
    const notification =
      await this.createNotificationService.createNotification(input);

    return NotificationMapper.toResponse(notification);
  }
}
