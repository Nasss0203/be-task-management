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

  private getRepo(manager?: EntityManager): Repository<Activity> {
    return manager ? manager.getRepository(Activity) : this.repo;
  }

  async save(
    activity: SaveActivityInput,
    manager?: EntityManager,
  ): Promise<ActivityModel> {
    const repo = this.getRepo(manager);

    const entity = ActivityMapper.toEntity(activity);

    const saved = await repo.save(entity);

    return ActivityMapper.toModel(saved);
  }
}
