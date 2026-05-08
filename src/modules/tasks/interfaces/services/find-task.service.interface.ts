import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';
import { FindTaskQueryDto } from '../../dto/find-task-query.dto';
import { PaginatedResponseDto } from '../../dto/paginated-response.dto';
import { TaskRestoreLookup } from '../repositories/find-task.repository.interface';

export interface FindTaskService {
  findAllTask(
    projectId: string,
    workspaceId: string,
    query: FindTaskQueryDto,
    manager?: EntityManager,
  ): Promise<PaginatedResponseDto<TaskModel>>;

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
    manager?: EntityManager,
  ): Promise<TaskModel[]>;
}
