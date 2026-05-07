import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TaskModel } from '../domain/models/task.model';
import {
  TaskRestoreLookup,
  type FindTaskRepository,
} from '../interfaces/repositories/find-task.repository.interface';
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
  findDeletedTasks(
    workspaceId: string,
    projectId: string,
  ): Promise<TaskModel[]> {
    return this.findTaskRepository.findDeletedTasks(workspaceId, projectId);
  }

  findOneTaskForRestore(
    workspaceId: string,
    taskId: string,
  ): Promise<TaskRestoreLookup | null> {
    return this.findTaskRepository.findOneTaskForRestore(workspaceId, taskId);
  }

  findBacklogTasks(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    return this.findTaskRepository.findAllBacklogTasks(
      projectId,
      workspaceId,
      manager,
    );
  }
}
