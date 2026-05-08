import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';
import { FindTaskQueryDto } from '../../dto/find-task-query.dto';
import { PaginatedResponseDto } from '../../dto/paginated-response.dto';

export type ParamTask = {
  projectId: string;
  workspaceId: string;
  query: FindTaskQueryDto;
  manager?: EntityManager;
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
  findAllTask(params: ParamTask): Promise<PaginatedResponseDto<TaskModel>>;

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

  findAllBacklogTasks(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskModel[]>;
}
