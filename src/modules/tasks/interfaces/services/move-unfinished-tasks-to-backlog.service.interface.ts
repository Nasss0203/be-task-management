import { EntityManager } from 'typeorm';

export type MoveUnfinishedTasksToBacklogServiceInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  doneStatusId: string;
  incompleteTaskIds?: string[];
};

export interface MoveUnfinishedTasksToBacklogService {
  move(
    input: MoveUnfinishedTasksToBacklogServiceInput,
    manager?: EntityManager,
  ): Promise<number>;
}
