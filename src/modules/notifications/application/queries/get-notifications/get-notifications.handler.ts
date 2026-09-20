import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { NotificationResponseDto } from '../../dto/response/notification.response.dto';
import { type NotificationRepository } from '../../../domain/repositories/notification.repository';
import { NOTIFICATION_TYPES } from '../../../notifications.types';
import { GetNotificationsQuery } from './get-notifications.query';

@Injectable()
export class GetNotificationsHandler {
  constructor(
    @Inject(NOTIFICATION_TYPES.repositories.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    query: GetNotificationsQuery,
  ): Promise<NotificationResponseDto[]> {
    if (!query.userId) {
      throw new BadRequestException('userId is required');
    }

    const notifications = await this.notificationRepository.findMyNotifications(
      {
        receiverId: query.userId,
        category: query.filters.category,
        unreadOnly: query.filters.unreadOnly ?? false,
        sourceType: query.filters.sourceType,
        sourceId: query.filters.sourceId,
        type: query.filters.type,
        workspaceId: query.filters.workspaceId,
        cursor: query.filters.cursor
          ? new Date(query.filters.cursor)
          : undefined,
        limit: query.filters.limit ? Number(query.filters.limit) : 30,
      },
    );

    return notifications.map((notification) =>
      NotificationResponseDto.fromModel(notification),
    );
  }
}
