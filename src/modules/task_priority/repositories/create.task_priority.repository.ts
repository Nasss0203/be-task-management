import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskPriority } from '../domain/entities/task_priority.entity';
import { TaskPriorityModel } from '../domain/models/task_priority.models';
import {
  CreateTaskPriorityRepository,
  SaveTaskPriorityInput,
} from '../interfaces/repositories/create.task_priority.repository.interface';
import { TaskPriorityMapper } from '../mapper/task_priority.mapper';

@Injectable()
export class CreateTaskPriorityRepositoryImpl implements CreateTaskPriorityRepository {
  constructor(
    @InjectRepository(TaskPriority)
    private readonly repo: Repository<TaskPriority>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskPriority> {
    return manager ? manager.getRepository(TaskPriority) : this.repo;
  }
  async save(
    task: TaskPriorityModel | SaveTaskPriorityInput,
    manager?: EntityManager,
  ): Promise<TaskPriorityModel> {
    const repo = this.getRepo(manager);
    const entity = TaskPriorityMapper.toEntity(task as TaskPriorityModel);
    const saved = await repo.save(entity);
    return TaskPriorityMapper.toModel(saved);
  }

  async saveMany(
    tasks: Array<TaskPriorityModel | SaveTaskPriorityInput>,
    manager?: EntityManager,
  ): Promise<TaskPriorityModel[]> {
    const repo = this.getRepo(manager);

    const entities = tasks.map((item) => TaskPriorityMapper.toEntity(item));
    const saved = await repo.save(entities);

    return saved.map((item) => TaskPriorityMapper.toModel(item));
  }
}
