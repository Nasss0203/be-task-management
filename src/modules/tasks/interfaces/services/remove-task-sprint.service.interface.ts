import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';

export type RemoveTaskFromSprintServiceInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  taskId: string;
};

export interface RemoveTaskFromSprintService {
  remove(
    input: RemoveTaskFromSprintServiceInput,
    manager?: EntityManager,
  ): Promise<TaskModel>;
}
