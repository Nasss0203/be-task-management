import { EntityManager } from 'typeorm';
import { TaskPriorityModel } from '../../domain/models/task_priority.models';

export type SaveTaskPriorityInput = Pick<
  TaskPriorityModel,
  'level' | 'name' | 'color' | 'workspaceId' | 'projectId'
> &
  Partial<Pick<TaskPriorityModel, 'id' | 'createdAt' | 'updatedAt'>>;

export interface CreateTaskPriorityRepository {
  save(
    workspace: TaskPriorityModel | SaveTaskPriorityInput,
    manager?: EntityManager,
  ): Promise<TaskPriorityModel>;

  saveMany(
    roles: Array<TaskPriorityModel | SaveTaskPriorityInput>,
    manager?: EntityManager,
  ): Promise<TaskPriorityModel[]>;
}
