import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskStatus } from '../domain/entities/task_status.entity';
import { TaskStatusModel } from '../domain/models/task_status.model';
import { FindTaskStatusRepository } from '../interfaces/repositories/find.task-status.repository.interface';
import { TaskStatusMapper } from '../mapper/task_status.mapper';

@Injectable()
export class FindTaskStatusRepositoryImpl implements FindTaskStatusRepository {
  constructor(
    @InjectRepository(TaskStatus)
    private readonly repo: Repository<TaskStatus>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskStatus> {
    return manager ? manager.getRepository(TaskStatus) : this.repo;
  }

  async findAllTaskStatus(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskStatusModel[]> {
    const entities = await this.getRepo(manager).find({
      where: {
        projectId: projectId,
        workspaceId: workspaceId,
      },
    });

    return entities.map((entity) => TaskStatusMapper.toModel(entity));
  }

  async findDoneStatus(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskStatusModel | null> {
    const repo = this.getRepo(manager);

    const status = await repo.findOne({
      where: {
        projectId,
        workspaceId,
        isDone: true,
      },
    });

    return status ? TaskStatusMapper.toModel(status) : null;
  }
}
