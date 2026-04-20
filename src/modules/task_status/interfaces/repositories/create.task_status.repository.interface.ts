import { EntityManager } from 'typeorm';
import { TaskStatusModel } from '../../domain/models/task_status.model';

export type SaveTaskStatusInput = Pick<
  TaskStatusModel,
  'name' | 'position' | 'projectId' | 'workspaceId' | 'color' | 'isDone'
> &
  Partial<Pick<TaskStatusModel, 'updatedAt' | 'createdAt' | 'id'>>;

export interface CreateTaskStatusRepository {
  save(
    workspace: TaskStatusModel | SaveTaskStatusInput,
    manager?: EntityManager,
  ): Promise<TaskStatusModel>;

  saveMany(
    roles: Array<TaskStatusModel | SaveTaskStatusInput>,
    manager?: EntityManager,
  ): Promise<TaskStatusModel[]>;
}
