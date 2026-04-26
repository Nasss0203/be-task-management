import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';

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
}
