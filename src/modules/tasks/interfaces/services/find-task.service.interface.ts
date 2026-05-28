import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';
import {
  FindBacklogTasksFilters,
  PaginatedTaskModels,
} from '../find-backlog-tasks-filters.interface';
import { TaskRestoreLookup } from '../repositories/find-task.repository.interface';

export interface FindTaskService {
  findAllTask(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskModel[]>;

  findAllTaskByWorkspace(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskModel[]>;

  findOneTask(
    taskId: string,
    manager?: EntityManager,
  ): Promise<TaskModel | null>;

  findDeletedTasks(
    workspaceId: string,
    projectId?: string,
  ): Promise<TaskModel[]>;

  findOneTaskForRestore(
    workspaceId: string,
    taskId: string,
  ): Promise<TaskRestoreLookup | null>;

  findBacklogTasks(
    projectId: string,
    workspaceId: string,
    filters?: FindBacklogTasksFilters,
    manager?: EntityManager,
  ): Promise<PaginatedTaskModels>;
}
