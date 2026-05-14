import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';

export interface MoveTaskSprintToSprintServiceInput {
  workspaceId: string;
  projectId: string;
  taskId: string;
  sourceSprintId: string;
  targetSprintId: string;
}

export interface MoveTaskSprintToSprintService {
  move(
    input: MoveTaskSprintToSprintServiceInput,
    manager?: EntityManager,
  ): Promise<TaskModel>;
}
