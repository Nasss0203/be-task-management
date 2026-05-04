import { EntityManager } from 'typeorm';

export interface DeleteTaskRepository {
  softDeleteTask(
    input: {
      taskId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void>;

  restoreTask(
    input: {
      taskId: string;
    },
    manager?: EntityManager,
  ): Promise<void>;
}
