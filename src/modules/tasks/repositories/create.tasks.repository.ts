import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Task } from '../domain/entities/task.entity';
import { TaskModel } from '../domain/models/task.model';

import {
  CreateTaskRepository,
  SaveTaskInput,
} from '../interfaces/repositories/create.task.repository.interface';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class CreateTaskRepositoryImpl implements CreateTaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.repo;
  }

  async save(
    task: TaskModel | SaveTaskInput,
    manager?: EntityManager,
  ): Promise<TaskModel> {
    const repo = this.getRepo(manager);
    const entity = TaskMapper.toEntity(task);
    const saved = await repo.save(entity);
    return TaskMapper.toModel(saved);
  }

  async saveMany(
    tasks: Array<TaskModel | SaveTaskInput>,
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    const repo = this.getRepo(manager);
    const entities = tasks.map((item) => TaskMapper.toEntity(item));
    const saved = await repo.save(entities);
    return saved.map((item) => TaskMapper.toModel(item));
  }
}
