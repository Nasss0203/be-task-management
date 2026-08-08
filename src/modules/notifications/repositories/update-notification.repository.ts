import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
} from '../domain/entities/notification.entity';
import {
  UpdateInviteNotificationStatusRepositoryInput,
  UpdateNotificationRepository,
} from '../interfaces/repositories/update-notification.repository.interface';

@Injectable()
export class UpdateNotificationRepositoryImpl implements UpdateNotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Notification> {
    return manager ? manager.getRepository(Notification) : this.repo;
  }

  async updateInviteNotificationStatus(
    input: UpdateInviteNotificationStatusRepositoryInput,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = this.getRepo(manager);

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

  async markAllAsRead(
    receiverId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = this.getRepo(manager);

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
    manager?: EntityManager,
  ): Promise<number> {
    const repo = this.getRepo(manager);

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
