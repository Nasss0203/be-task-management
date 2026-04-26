import { EntityManager } from 'typeorm';
import { TaskAssigneeModel } from '../../domain/models/task_assignee.model';

export type SaveTaskAssigneeInput = {
  taskId: string;
  userId: string;
  assignedBy?: string | null;
};

export interface CreateTaskAssigneeRepository {
  save(
    input: SaveTaskAssigneeInput,
    manager?: EntityManager,
  ): Promise<TaskAssigneeModel>;
}
