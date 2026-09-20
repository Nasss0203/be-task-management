import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PersistenceContext } from 'src/shared/domain/persistence-context';
import { type NotificationRepository } from '../../domain/repositories/notification.repository';
import {
  UpdateInviteNotificationStatusServiceInput,
  UpdateNotificationService,
} from '../ports/update-notification.service.port';
import { NOTIFICATION_TYPES } from '../../notifications.types';

@Injectable()
export class UpdateNotificationServiceImpl implements UpdateNotificationService {
  constructor(
    @Inject(NOTIFICATION_TYPES.repositories.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,
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

    return this.notificationRepository.updateInviteNotificationStatus(
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

    return this.notificationRepository.markAllAsRead(userId, context);
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

    return this.notificationRepository.markAsRead(
      notificationId,
      userId,
      context,
    );
  }
}
