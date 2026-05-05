import { EntityManager } from 'typeorm';
import { TaskStatusModel } from '../../domain/models/task_status.model';

export interface FindTaskStatusRepository {
  findAllTaskStatus(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskStatusModel[]>;

  findDoneStatus(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskStatusModel | null>;
}
