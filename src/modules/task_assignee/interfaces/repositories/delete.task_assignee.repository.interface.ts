import { EntityManager } from 'typeorm';

export interface DeleteTaskAssigneeRepository {
  deleteByTaskAndUser(
    taskId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<void>;
}
