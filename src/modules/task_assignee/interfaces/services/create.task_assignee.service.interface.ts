import { EntityManager } from 'typeorm';
import { TaskAssigneeModel } from '../../domain/models/task_assignee.model';

export type TaskAssigneeInput = {
  taskId: string;
  userId: string;
  assignedBy: string | null;
};

export interface CreateTaskAssigneeService {
  assign(
    input: TaskAssigneeInput,
    manager?: EntityManager,
  ): Promise<TaskAssigneeModel>;
}
