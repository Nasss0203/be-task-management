import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';

export interface MoveTaskSprintRepository {
  moveTaskToSprint(
    taskId: string,
    sprintId: string | null,
    manager?: EntityManager,
  ): Promise<TaskModel>;

  moveManyTaskToSprint(
    taskIds: string[],
    sprintId: string,
    manager?: EntityManager,
  ): Promise<void>;
}
