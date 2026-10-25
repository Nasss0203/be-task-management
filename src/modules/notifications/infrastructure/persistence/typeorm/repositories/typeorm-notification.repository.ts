import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, IsNull, Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {
  NotificationModel,
  NotificationType,
} from '../../../../domain/entities/notification.entity';
import {
  FindMyNotificationsRepositoryInput,
  NotificationRepository,
  SaveNotificationInput,
  UpdateInviteNotificationStatusRepositoryInput,
  UpdatePageAccessRequestNotificationStatusRepositoryInput,
  UpdatePageEditRequestNotificationStatusRepositoryInput,
} from '../../../../domain/repositories/notification.repository';
import { Notification } from '../entities/notification.orm-entity';
import { NotificationMapper } from '../mappers/notification.mapper';

@Injectable()
export class TypeOrmNotificationRepository implements NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  private getRepo(context?: PersistenceContext): Repository<Notification> {
    return context
      ? (context as EntityManager).getRepository(Notification)
      : this.repo;
  }

  async saveNotification(
    input: SaveNotificationInput,
    context?: PersistenceContext,
  ): Promise<NotificationModel> {
    const repo = this.getRepo(context);

    const entity = NotificationMapper.toEntity(input);

    const saved = await repo.save(entity);

    return NotificationMapper.toModel(saved);
  }

  async insertNotificationIfAbsent(
    input: SaveNotificationInput & { id: string },
  ): Promise<NotificationModel | null> {
    const result = await this.repo.createQueryBuilder()
      .insert()
      .into(Notification)
      .values(NotificationMapper.toEntity(input) as unknown as QueryDeepPartialEntity<Notification>)
      .orIgnore()
      .returning('id')
      .execute();
    if (result.raw.length === 0) return null;
    const inserted = await this.repo.findOneByOrFail({ id: input.id });
    return NotificationMapper.toModel(inserted);
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
      .addOrderBy('notification.id', 'DESC')
      .take(limit);

    if (input.unreadOnly) {
      qb.andWhere('notification.readAt IS NULL');
    }

    if (input.category === 'human') {
      qb.andWhere('notification.type IN (:...humanTypes)', {
        humanTypes: [
          NotificationType.WORKSPACE_INVITE,
          NotificationType.WORKSPACE_INVITE_ACCEPTED,
          NotificationType.WORKSPACE_MEMBER_JOINED,
          NotificationType.WORKSPACE_MEMBER_REMOVED,
          NotificationType.TEAMSPACE_INVITATION_RECEIVED,
          NotificationType.PAGE_ACCESS_REQUESTED,
          NotificationType.PAGE_ACCESS_APPROVED,
          NotificationType.PAGE_ACCESS_REJECTED,
          NotificationType.COMMENT_MENTIONED,
          NotificationType.COMMENT_REPLIED,
        ],
      });
    } else if (input.category === 'system') {
      qb.andWhere('notification.type IN (:...systemTypes)', {
        systemTypes: [
          NotificationType.SYSTEM_ANNOUNCEMENT,
          NotificationType.SYSTEM_MAINTENANCE,
          NotificationType.ACCOUNT_SECURITY,
          NotificationType.PASSWORD_CHANGED,
          NotificationType.EMAIL_VERIFIED,
        ],
      });
    }

    if (input.sourceType) {
      qb.andWhere('notification.sourceType = :sourceType', {
        sourceType: input.sourceType,
      });
    }

    if (input.sourceId) {
      qb.andWhere('notification.sourceId = :sourceId', {
        sourceId: input.sourceId,
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

    if (input.cursorId) {
      // Compare against the stored µs timestamp; a JS Date cursor is truncated to ms and can skip rows.
      // Scoped to the receiver, so another user's id yields an empty page instead of leaking data.
      // Single-column subquery: TypeORM reorders multi-column entity selects by metadata.
      const cursorCreatedAt = qb
        .subQuery()
        .select('cursor_row.created_at')
        .from(Notification, 'cursor_row')
        .where('cursor_row.id = :cursorId')
        .andWhere('cursor_row.receiverId = :receiverId')
        .getQuery();

      qb.andWhere(
        `(notification.createdAt, notification.id) < (${cursorCreatedAt}, CAST(:cursorId AS uuid))`,
        { cursorId: input.cursorId },
      );
    } else if (input.cursor) {
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

  async updateInviteNotificationStatus(
    input: UpdateInviteNotificationStatusRepositoryInput,
    context?: PersistenceContext,
  ): Promise<number> {
    const repo = this.getRepo(context);

    const notifications = await repo
      .createQueryBuilder('notification')
      .where('notification.type = :type', {
        type: NotificationType.WORKSPACE_INVITE,
      })
      .andWhere("notification.metadata ->> 'inviteId' = :inviteId", {
        inviteId: input.inviteId,
      })
      .getMany();

    if (notifications.length === 0) {
      return 0;
    }

    const updatedNotifications = notifications.map((notification) => {
      notification.metadata = {
        ...(notification.metadata ?? {}),
        inviteStatus: input.inviteStatus,
      };

      return notification;
    });

    const savedNotifications = await repo.save(updatedNotifications);

    return savedNotifications.length;
  }

  async updatePageAccessRequestNotificationStatus(
    input: UpdatePageAccessRequestNotificationStatusRepositoryInput,
    context?: PersistenceContext,
  ): Promise<number> {
    const repo = this.getRepo(context);

    const notifications = await repo
      .createQueryBuilder('notification')
      .where('notification.type = :type', {
        type: NotificationType.PAGE_ACCESS_REQUESTED,
      })
      .andWhere(
        "notification.metadata ->> 'accessRequestId' = :accessRequestId",
        {
          accessRequestId: input.accessRequestId,
        },
      )
      .getMany();

    if (notifications.length === 0) {
      return 0;
    }

    const updatedNotifications = notifications.map((notification) => {
      notification.metadata = {
        ...(notification.metadata ?? {}),
        status: input.status,
        reviewerId: input.reviewerId,
        ...(input.accessLevel
          ? {
              accessLevel: input.accessLevel,
            }
          : {}),
      };

      return notification;
    });

    const savedNotifications = await repo.save(updatedNotifications);

    return savedNotifications.length;
  }

  async updatePageEditRequestNotificationStatus(
    input: UpdatePageEditRequestNotificationStatusRepositoryInput,
    context?: PersistenceContext,
  ): Promise<number> {
    const result = await this.getRepo(context)
      .createQueryBuilder()
      .update()
      .set({
        metadata: () =>
          `COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('status', CAST(:status AS text), 'reviewerId', CAST(:reviewerId AS text))`,
      })
      .where('type = :type', { type: NotificationType.PAGE_EDIT_REQUESTED })
      .andWhere("metadata ->> 'editRequestId' = :editRequestId")
      .setParameters({
        status: input.status,
        reviewerId: input.reviewerId,
        editRequestId: input.editRequestId,
      })
      .execute();

    return result.affected ?? 0;
  }

  async markAllAsRead(
    receiverId: string,
    context?: PersistenceContext,
  ): Promise<number> {
    const repo = this.getRepo(context);

    const result = await repo
      .createQueryBuilder()
      .update(Notification)
      .set({
        readAt: () => 'CURRENT_TIMESTAMP',
      })
      .where('receiver_id = :receiverId', { receiverId })
      .andWhere('read_at IS NULL')
      .andWhere('archived_at IS NULL')
      .execute();

    return result.affected ?? 0;
  }

  async markAsRead(
    notificationId: string,
    receiverId: string,
    context?: PersistenceContext,
  ): Promise<number> {
    const repo = this.getRepo(context);

    const result = await repo
      .createQueryBuilder()
      .update(Notification)
      .set({
        readAt: () => 'CURRENT_TIMESTAMP',
      })
      .where('id = :notificationId', { notificationId })
      .andWhere('receiver_id = :receiverId', { receiverId })
      .andWhere('read_at IS NULL')
      .andWhere('archived_at IS NULL')
      .execute();

    return result.affected ?? 0;
  }
}
