import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Activity } from '../domain/entities/activity.entity';
import { ActivityModel } from '../domain/models/activity.model';
import {
  CreateActivityRepository,
  SaveActivityInput,
} from '../interfaces/repositories/create-activity.repository.interface';
import { ActivityMapper } from '../mapper/activity.mapper';

@Injectable()
export class CreateActivityRepositoryImpl implements CreateActivityRepository {
  constructor(
    @InjectRepository(Activity)
    private readonly repo: Repository<Activity>,
  ) {}

  private getRepo(context?: PersistenceContext): Repository<Activity> {
    return context
      ? (context as EntityManager).getRepository(Activity)
      : this.repo;
  }

  async save(
    activity: SaveActivityInput,
    context?: PersistenceContext,
  ): Promise<ActivityModel> {
    const repo = this.getRepo(context);

    const entity = ActivityMapper.toEntity(activity);

    const saved = await repo.save(entity);

    return ActivityMapper.toModel(saved);
  }
}
