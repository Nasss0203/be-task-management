import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';

export type ParamTask = {
  projectId: string;
  workspaceId: string;
};

export interface FindTaskRepository {
  findAllTask(params: ParamTask, manager?: EntityManager): Promise<TaskModel[]>;
  findAllTaskByWorkspace(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskModel[]>;
}
