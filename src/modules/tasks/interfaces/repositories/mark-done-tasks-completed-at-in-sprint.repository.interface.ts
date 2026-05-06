// src/modules/tasks/interfaces/repositories/mark-done-tasks-completed-at-in-sprint.repository.interface.ts

import { EntityManager } from 'typeorm';

export type MarkDoneTasksCompletedAtInSprintRepositoryInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  doneStatusId: string;
  completedAt: Date;
};

export interface MarkDoneTasksCompletedAtInSprintRepository {
  mark(
    input: MarkDoneTasksCompletedAtInSprintRepositoryInput,
    manager?: EntityManager,
  ): Promise<void>;
}
