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

export type TaskDueSoonAssignee = {
  userId: string;
  username: string | null;
};

export type TaskDueSoonLookup = {
  id: string;
  workspaceId: string;
  workspaceName: string | null;
  workspaceSlug: string;
  projectId: string;
  projectName: string | null;
  projectSeq: number | null;
  title: string | null;
  statusName: string | null;
  dueAt: Date;
  assignees: TaskDueSoonAssignee[];
};

export interface FindTaskRepository {
  findAllTask(
    params: ParamTask,
    filters?: FindBacklogTasksFilters,
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

  findTasksDueSoon(
    days: number,
    manager?: EntityManager,
  ): Promise<TaskDueSoonLookup[]>;
}
