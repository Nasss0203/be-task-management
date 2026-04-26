import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Task } from '../domain/entities/task.entity';
import { TaskModel } from '../domain/models/task.model';
import {
  ParamTask,
  type FindTaskRepository,
} from '../interfaces/repositories/find-task.repository.interface';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class FindTaskRepositoryImpl implements FindTaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.repo;
  }

  async findAllTask(
    params: ParamTask,
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    const { projectId, workspaceId } = params;
    const entities = await this.getRepo(manager).find({
      where: {
        projectId: projectId,
        workspaceId: workspaceId,
      },
      relations: {
        status: true,
        priority: true,
        // hiện thị người được thêm task
        assignees: {
          user: true,
          assignedByUser: true,
        },
      },
    });

    return entities.map((entity) => TaskMapper.toModel(entity));
  }

  async findAllTaskByWorkspace(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    const entities = await this.getRepo(manager).find({
      where: {
        workspaceId,
      },
      relations: {
        status: true,
        priority: true,
      },
    });

    return entities.map((entity) => TaskMapper.toModel(entity));
  }
}
