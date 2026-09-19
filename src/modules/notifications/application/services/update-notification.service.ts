import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PersistenceContext } from 'src/shared/domain/persistence-context';
import { type UpdateNotificationRepository } from '../../domain/repositories/update-notification.repository';
import {
  UpdateInviteNotificationStatusServiceInput,
  UpdateNotificationService,
} from '../ports/update-notification.service.port';
import { NOTIFICATION_TYPES } from '../../notifications.types';

@Injectable()
export class UpdateNotificationServiceImpl implements UpdateNotificationService {
  constructor(
    @Inject(NOTIFICATION_TYPES.repositories.UpdateNotificationRepository)
    private readonly updateNotificationRepository: UpdateNotificationRepository,
  ) {}

  async updateInviteNotificationStatus(
    input: UpdateInviteNotificationStatusServiceInput,
    context?: PersistenceContext,
  ): Promise<number> {
    if (!input.inviteId) {
      throw new BadRequestException('inviteId is required');
    }

    if (!input.inviteStatus) {
      throw new BadRequestException('inviteStatus is required');
    }

    return this.updateNotificationRepository.updateInviteNotificationStatus(
      input,
      context,
    );
  }

  async markAllAsRead(
    userId: string,
    context?: PersistenceContext,
  ): Promise<number> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.updateNotificationRepository.markAllAsRead(userId, context);
  }

  async markAsRead(
    notificationId: string,
    userId: string,
    context?: PersistenceContext,
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
      context,
    );
  }
}
