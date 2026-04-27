import { EntityManager } from 'typeorm';
import { TaskAssigneeModel } from '../../domain/models/task_assignee.model';

export interface FindTaskAssigneeRepository {
  findOneTaskAssignee(
    taskId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<TaskAssigneeModel | null>;
}
