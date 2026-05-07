import { EntityManager } from 'typeorm';

export type MoveUnfinishedTasksToBacklogServiceInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  doneStatusId: string;
};

export interface MoveUnfinishedTasksToBacklogService {
  move(
    input: MoveUnfinishedTasksToBacklogServiceInput,
    manager?: EntityManager,
  ): Promise<number>;
}
