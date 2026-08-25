import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
// src/modules/notifications/repositories/find-notification.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { Notification } from '../domain/entities/notification.entity';
import { NotificationModel } from '../domain/models/notification.model';
import {
  FindMyNotificationsRepositoryInput,
  FindNotificationRepository,
  NotificationTaskLookupInput,
  NotificationSprintLookupInput,
} from '../interfaces/repositories/find-notification.repository.interface';
import { NotificationMapper } from '../mapper/notifications.mapper';

@Injectable()
export class FindNotificationRepositoryImpl implements FindNotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  private getRepo(context?: PersistenceContext): Repository<Notification> {
    return context
      ? (context as EntityManager).getRepository(Notification)
      : this.repo;
  }

  async findMyNotifications(
    input: FindMyNotificationsRepositoryInput,
    context?: PersistenceContext,
  ): Promise<NotificationModel[]> {
    const repo = this.getRepo(context);

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

    if (input.category === 'human') {
      qb.andWhere('notification.type IN (:...humanTypes)', {
        humanTypes: [
          'WORKSPACE_INVITE',
          'WORKSPACE_INVITE_ACCEPTED',
          'WORKSPACE_MEMBER_JOINED',
          'WORKSPACE_MEMBER_REMOVED',
          'TASK_ASSIGNED',
          'COMMENT_MENTION',
          'COMMENT_REPLY',
        ],
      });
    } else if (input.category === 'system') {
      qb.andWhere('notification.type IN (:...systemTypes)', {
        systemTypes: [
          'SYSTEM_ANNOUNCEMENT',
          'SYSTEM_MAINTENANCE',
          'ACCOUNT_SECURITY',
          'PASSWORD_CHANGED',
          'EMAIL_VERIFIED',
          'PROJECT_CREATED',
          'PROJECT_UPDATED',
          'TASK_UPDATED',
          'TASK_DUE_SOON',
          'TASK_OVERDUE',
          'SPRINT_STARTED',
          'SPRINT_COMPLETED',
          'SPRINT_DUE_SOON',
          'SPRINT_OVERDUE',
        ],
      });
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

    return notifications.map((notification) =>
      NotificationMapper.toModel(notification),
    );
  }

  async countUnread(
    receiverId: string,
    context?: PersistenceContext,
  ): Promise<number> {
    const repo = this.getRepo(context);

    return repo.count({
      where: {
        receiverId,
        readAt: IsNull(),
        archivedAt: IsNull(),
      },
    });
  }

  async existsByReceiverTypeAndTask(
    input: NotificationTaskLookupInput,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const repo = this.getRepo(context);

    const count = await repo.count({
      where: {
        receiverId: input.receiverId,
        type: input.type,
        taskId: input.taskId,
      },
    });

    return count > 0;
  }

  async existsByReceiverTypeAndSprint(
    input: NotificationSprintLookupInput,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const repo = this.getRepo(context);

    const count = await repo.count({
      where: {
        receiverId: input.receiverId,
        type: input.type,
        sprintId: input.sprintId,
      },
    });

    return count > 0;
  }
}
