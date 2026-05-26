import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';
import {
  FindBacklogTasksFilters,
  PaginatedTaskModels,
} from '../find-backlog-tasks-filters.interface';

export type ParamTask = {
  projectId: string;
  workspaceId: string;
};

export type TaskRestoreLookup = {
  id: string;
  workspaceId: string;
  projectId: string;
  deletedAt: Date | null;
  workspaceDeletedAt: Date | null;
  projectDeletedAt: Date | null;
};

export interface FindTaskRepository {
  findAllTask(params: ParamTask, manager?: EntityManager): Promise<TaskModel[]>;
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
    projectId: string,
  ): Promise<TaskModel[]>;

  findOneTaskForRestore(
    workspaceId: string,
    taskId: string,
  ): Promise<TaskRestoreLookup | null>;

  findAllBacklogTasks(
    projectId: string,
    workspaceId: string,
    filters?: FindBacklogTasksFilters,
    manager?: EntityManager,
  ): Promise<PaginatedTaskModels>;

  findByIds(taskIds: string[], manager?: EntityManager): Promise<TaskModel[]>;
}
