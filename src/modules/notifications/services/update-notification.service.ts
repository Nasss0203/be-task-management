import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type UpdateNotificationRepository } from '../interfaces/repositories/update-notification.repository.interface';
import {
  UpdateInviteNotificationStatusServiceInput,
  UpdateNotificationService,
} from '../interfaces/services/update-notification.service.interface';
import { NOTIFICATION_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateNotificationServiceImpl implements UpdateNotificationService {
  constructor(
    @Inject(NOTIFICATION_TYPES.repositories.UpdateNotificationRepository)
    private readonly updateNotificationRepository: UpdateNotificationRepository,
  ) {}

  async updateInviteNotificationStatus(
    input: UpdateInviteNotificationStatusServiceInput,
    manager?: EntityManager,
  ): Promise<number> {
    if (!input.inviteId) {
      throw new BadRequestException('inviteId is required');
    }

    if (!input.inviteStatus) {
      throw new BadRequestException('inviteStatus is required');
    }

    return this.updateNotificationRepository.updateInviteNotificationStatus(
      input,
      manager,
    );
  }

  async markAllAsRead(
    userId: string,
    manager?: EntityManager,
  ): Promise<number> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.updateNotificationRepository.markAllAsRead(userId, manager);
  }

  async markAsRead(
    notificationId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<number> {
    if (!notificationId) {
      throw new BadRequestException('notificationId is required');
    }

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.updateNotificationRepository.markAsRead(
      notificationId,
      userId,
      manager,
    );
  }
}
