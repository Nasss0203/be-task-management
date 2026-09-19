// src/modules/notifications/applications/create-notification.application.impl.ts

import { Inject, Injectable } from '@nestjs/common';
import { NotificationResponseDto } from '../../dto/response/notification.response.dto';
import {
  CreateNotificationApplication,
  CreateNotificationApplicationInput,
} from '../../ports/create-notification.application.port';
import { type CreateNotificationService } from '../../ports/create-notification.service.port';
import { NOTIFICATION_TYPES } from '../../../notifications.types';

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

    return NotificationResponseDto.fromModel(notification);
  }
}
