import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TaskModel } from '../domain/models/task.model';
import { type FindTaskRepository } from '../interfaces/repositories/find-task.repository.interface';
import { FindTaskService } from '../interfaces/services/find-task.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class FindTaskServiceImpl implements FindTaskService {
  constructor(
    @Inject(TASK_TYPES.repositories.FindTaskRepository)
    private readonly findTaskRepository: FindTaskRepository,
  ) {}

  findAllTaskByWorkspace(workspaceId: string): Promise<TaskModel[]> {
    return this.findTaskRepository.findAllTaskByWorkspace(workspaceId);
  }

  async findAllTask(
    projectId: string,
    workspaceId: string,
  ): Promise<TaskModel[]> {
    return this.findTaskRepository.findAllTask({
      projectId,
      workspaceId,
    });
  }

  async findOneTask(
    taskId: string,
    manager?: EntityManager,
  ): Promise<TaskModel | null> {
    return await this.findTaskRepository.findOneTask(taskId, manager);
  }
}
