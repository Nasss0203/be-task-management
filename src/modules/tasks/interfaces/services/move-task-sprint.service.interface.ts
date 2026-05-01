import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';

export interface MoveTaskSprintServiceInput {
  taskId: string;
  sprintId: string | null;
  manager?: EntityManager;
}

export interface MoveTaskSprintService {
  move(input: MoveTaskSprintServiceInput): Promise<TaskModel>;
}
