import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
// src/modules/notifications/repositories/create-notification.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Notification } from '../domain/entities/notification.entity';
import { NotificationModel } from '../domain/models/notification.model';
import {
  CreateNotificationRepository,
  SaveNotificationInput,
} from '../interfaces/repositories/create.notifications.repository.interface';
import { NotificationMapper } from '../mapper/notifications.mapper';

@Injectable()
export class CreateNotificationRepositoryImpl implements CreateNotificationRepository {
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
}
