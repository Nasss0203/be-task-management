import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskStatus } from '../domain/entities/task_status.entity';
import { TaskStatusModel } from '../domain/models/task_status.model';
import {
  CreateTaskStatusRepository,
  SaveTaskStatusInput,
} from '../interfaces/repositories/create.task_status.repository.interface';
import { TaskStatusMapper } from '../mapper/task_status.mapper';

@Injectable()
export class CreateTaskStatusRepositoryImpl implements CreateTaskStatusRepository {
  constructor(
    @InjectRepository(TaskStatus)
    private readonly repo: Repository<TaskStatus>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskStatus> {
    return manager ? manager.getRepository(TaskStatus) : this.repo;
  }
  async save(
    task: TaskStatusModel | SaveTaskStatusInput,
    manager?: EntityManager,
  ): Promise<TaskStatusModel> {
    const repo = this.getRepo(manager);
    const entity = TaskStatusMapper.toEntity(task as TaskStatusModel);
    const saved = await repo.save(entity);
    return TaskStatusMapper.toModel(saved);
  }

  async saveMany(
    tasks: Array<TaskStatusModel | SaveTaskStatusInput>,
    manager?: EntityManager,
  ): Promise<TaskStatusModel[]> {
    const repo = this.getRepo(manager);

    const entities = tasks.map((item) => TaskStatusMapper.toEntity(item));
    const saved = await repo.save(entities);

    return saved.map((item) => TaskStatusMapper.toModel(item));
  }
}
