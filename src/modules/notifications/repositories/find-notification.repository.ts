// src/modules/notifications/repositories/find-notification.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { Notification } from '../domain/entities/notification.entity';
import { NotificationModel } from '../domain/models/notification.model';
import {
  FindMyNotificationsRepositoryInput,
  FindNotificationRepository,
} from '../interfaces/repositories/find-notification.repository.interface';
import { NotificationMapper } from '../mapper/notifications.mapper';

@Injectable()
export class FindNotificationRepositoryImpl implements FindNotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Notification> {
    return manager ? manager.getRepository(Notification) : this.repo;
  }

  async findMyNotifications(
    input: FindMyNotificationsRepositoryInput,
    manager?: EntityManager,
  ): Promise<NotificationModel[]> {
    const repo = this.getRepo(manager);

    const limit = input.limit ?? 30;

    const qb = repo
      .createQueryBuilder('notification')
      .where('notification.receiverId = :receiverId', {
        receiverId: input.receiverId,
      })
      .andWhere('notification.archivedAt IS NULL')
      .orderBy('notification.createdAt', 'DESC')
      .take(limit);

    if (input.unreadOnly) {
      qb.andWhere('notification.readAt IS NULL');
    }

    if (input.sourceType) {
      qb.andWhere('notification.sourceType = :sourceType', {
        sourceType: input.sourceType,
      });
    }

    if (input.type) {
      qb.andWhere('notification.type = :type', {
        type: input.type,
      });
    }

    if (input.workspaceId) {
      qb.andWhere('notification.workspaceId = :workspaceId', {
        workspaceId: input.workspaceId,
      });
    }

    if (input.projectId) {
      qb.andWhere('notification.projectId = :projectId', {
        projectId: input.projectId,
      });
    }

    if (input.taskId) {
      qb.andWhere('notification.taskId = :taskId', {
        taskId: input.taskId,
      });
    }

    if (input.cursor) {
      qb.andWhere('notification.createdAt < :cursor', {
        cursor: input.cursor,
      });
    }

    const notifications = await qb.getMany();

    return notifications.map(NotificationMapper.toModel);
  }

  async countUnread(
    receiverId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = this.getRepo(manager);

    return repo.count({
      where: {
        receiverId,
        readAt: IsNull(),
        archivedAt: IsNull(),
      },
    });
  }
}
