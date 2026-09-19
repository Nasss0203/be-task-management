import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PersistenceContext } from 'src/shared/domain/persistence-context';
import { NotificationModel } from '../../domain/entities/notification.entity';
import {
  FindMyNotificationsRepositoryInput,
  type FindNotificationRepository,
} from '../../domain/repositories/find-notification.repository';
import {
  FindMyNotificationsServiceInput,
  FindNotificationService,
} from '../ports/find-notification.service.port';
import { NOTIFICATION_TYPES } from '../../notifications.types';

@Injectable()
export class FindNotificationServiceImpl implements FindNotificationService {
  constructor(
    @Inject(NOTIFICATION_TYPES.repositories.FindNotificationRepository)
    private readonly findNotificationRepository: FindNotificationRepository,
  ) {}

  async findMyNotifications(
    input: FindMyNotificationsServiceInput,
    context?: PersistenceContext,
  ): Promise<NotificationModel[]> {
    if (!input.userId) {
      throw new BadRequestException('userId is required');
    }

    const repositoryInput: FindMyNotificationsRepositoryInput = {
      receiverId: input.userId,
      category: input.category,
      unreadOnly: input.unreadOnly ?? false,

      sourceType: input.sourceType,
      type: input.type,

      workspaceId: input.workspaceId,
      projectId: input.projectId,
      taskId: input.taskId,

      cursor: input.cursor,
      limit: input.limit ?? 30,
    };

    return this.findNotificationRepository.findMyNotifications(
      repositoryInput,
      context,
    );
  }

  async countUnread(
    userId: string,
    context?: PersistenceContext,
  ): Promise<number> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.findNotificationRepository.countUnread(userId, context);
  }
}
