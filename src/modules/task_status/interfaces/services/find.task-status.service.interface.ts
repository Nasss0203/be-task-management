import { EntityManager } from 'typeorm';
import { TaskStatusModel } from '../../domain/models/task_status.model';

export interface FindTaskStatusService {
  findAllTaskStatus(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskStatusModel[]>;
}
