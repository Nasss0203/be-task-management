import { EntityManager } from 'typeorm';

export type MoveTasksToBacklogBySprintInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
};

export interface MoveTasksToBacklogBySprintService {
  move(
    input: MoveTasksToBacklogBySprintInput,
    manager?: EntityManager,
  ): Promise<void>;
}
