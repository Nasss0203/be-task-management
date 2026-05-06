// src/modules/tasks/interfaces/repositories/move-tasks-to-backlog-by-sprint.repository.interface.ts

import { EntityManager } from 'typeorm';

export type MoveTasksToBacklogBySprintRepositoryInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
};

export interface MoveTasksToBacklogBySprintRepository {
  move(
    input: MoveTasksToBacklogBySprintRepositoryInput,
    manager?: EntityManager,
  ): Promise<void>;
}
