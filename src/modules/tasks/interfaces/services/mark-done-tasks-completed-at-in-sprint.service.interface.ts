// src/modules/tasks/interfaces/services/mark-done-tasks-completed-at-in-sprint.service.interface.ts

import { EntityManager } from 'typeorm';

export type MarkDoneTasksCompletedAtInSprintInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  doneStatusId: string;
  completedAt?: Date;
};

export interface MarkDoneTasksCompletedAtInSprintService {
  mark(
    input: MarkDoneTasksCompletedAtInSprintInput,
    manager?: EntityManager,
  ): Promise<void>;
}
