import { EntityManager } from 'typeorm';
import { TaskPriorityModel } from '../../domain/models/task_priority.models';

export interface FindTaskPriorityService {
  findAllTaskPriority(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskPriorityModel[]>;

  findDonePriority(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskPriorityModel | null>;
}
