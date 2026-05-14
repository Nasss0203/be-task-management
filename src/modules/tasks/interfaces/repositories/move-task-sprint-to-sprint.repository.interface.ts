import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';

export interface MoveTaskSprintToSprintRepositoryInput {
  workspaceId: string;
  projectId: string;
  taskId: string;
  targetSprintId: string;
}

export interface MoveTaskSprintToSprintRepository {
  move(
    input: MoveTaskSprintToSprintRepositoryInput,
    manager?: EntityManager,
  ): Promise<TaskModel>;
}
