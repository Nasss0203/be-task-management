import { EntityManager } from 'typeorm';

export interface DeleteSprintRepository {
  softDeleteSprint(
    input: {
      sprintId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void>;

  restoreSprint(
    input: {
      sprintId: string;
    },
    manager?: EntityManager,
  ): Promise<void>;
}
