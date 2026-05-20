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

  private getRepo(manager?: EntityManager): Repository<Notification> {
    return manager ? manager.getRepository(Notification) : this.repo;
  }

  async saveNotification(
    input: SaveNotificationInput,
    manager?: EntityManager,
  ): Promise<NotificationModel> {
    const repo = this.getRepo(manager);

    const entity = NotificationMapper.toEntity(input);

    const saved = await repo.save(entity);

    return NotificationMapper.toModel(saved);
  }
}
