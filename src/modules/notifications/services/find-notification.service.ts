import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { NotificationModel } from '../domain/models/notification.model';
import {
  FindMyNotificationsRepositoryInput,
  type FindNotificationRepository,
} from '../interfaces/repositories/find-notification.repository.interface';
import {
  FindMyNotificationsServiceInput,
  FindNotificationService,
} from '../interfaces/services/find-notification.service.interface';
import { NOTIFICATION_TYPES } from '../interfaces/types';

@Injectable()
export class FindNotificationServiceImpl implements FindNotificationService {
  constructor(
    @Inject(NOTIFICATION_TYPES.repositories.FindNotificationRepository)
    private readonly findNotificationRepository: FindNotificationRepository,
  ) {}

  async findMyNotifications(
    input: FindMyNotificationsServiceInput,
    manager?: EntityManager,
  ): Promise<NotificationModel[]> {
    if (!input.userId) {
      throw new BadRequestException('userId is required');
    }

    const repositoryInput: FindMyNotificationsRepositoryInput = {
      receiverId: input.userId,
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
      manager,
    );
  }

  async countUnread(userId: string, manager?: EntityManager): Promise<number> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.findNotificationRepository.countUnread(userId, manager);
  }
}
