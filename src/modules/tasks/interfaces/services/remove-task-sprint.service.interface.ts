import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';

export type RemoveTaskFromSprintServiceInput = {
  taskId: string;
};

export interface RemoveTaskFromSprintService {
  remove(
    input: RemoveTaskFromSprintServiceInput,
    manager?: EntityManager,
  ): Promise<TaskModel>;
}
