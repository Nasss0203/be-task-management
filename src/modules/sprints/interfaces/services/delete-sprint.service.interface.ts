import { EntityManager } from 'typeorm';

export interface DeleteSprintService {
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
