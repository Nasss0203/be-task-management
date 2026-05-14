import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';

export interface MoveTaskSprintServiceInput {
  taskId: string;
  sprintId: string | null;
  manager?: EntityManager;
}

export interface MoveManyTaskSprintServiceInput {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  taskIds: string[];
  manager?: EntityManager;
}

export interface MoveTaskSprintService {
  move(input: MoveTaskSprintServiceInput): Promise<TaskModel>;

  moveMany(input: MoveManyTaskSprintServiceInput): Promise<void>;
}
