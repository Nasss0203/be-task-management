import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { type NotificationRepository } from '../../../domain/repositories/notification.repository';
import { NOTIFICATION_TYPES } from '../../../notifications.types';
import { GetUnreadCountQuery } from './get-unread-count.query';

@Injectable()
export class GetUnreadCountHandler {
  constructor(
    @Inject(NOTIFICATION_TYPES.repositories.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(query: GetUnreadCountQuery): Promise<{ count: number }> {
    if (!query.userId) {
      throw new BadRequestException('userId is required');
    }

    const count = await this.notificationRepository.countUnread(query.userId);
    return { count };
  }
}
