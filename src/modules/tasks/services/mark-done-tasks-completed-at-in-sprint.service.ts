// src/modules/tasks/services/mark-done-tasks-completed-at-in-sprint.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type MarkDoneTasksCompletedAtInSprintRepository } from '../interfaces/repositories/mark-done-tasks-completed-at-in-sprint.repository.interface';
import {
  MarkDoneTasksCompletedAtInSprintInput,
  MarkDoneTasksCompletedAtInSprintService,
} from '../interfaces/services/mark-done-tasks-completed-at-in-sprint.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class MarkDoneTasksCompletedAtInSprintServiceImpl implements MarkDoneTasksCompletedAtInSprintService {
  constructor(
    @Inject(TASK_TYPES.repositories.MarkDoneTasksCompletedAtInSprintRepository)
    private readonly repo: MarkDoneTasksCompletedAtInSprintRepository,
  ) {}

  async mark(
    input: MarkDoneTasksCompletedAtInSprintInput,
    manager?: EntityManager,
  ): Promise<void> {
    await this.repo.mark(
      {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        sprintId: input.sprintId,
        doneStatusId: input.doneStatusId,
        completedAt: input.completedAt ?? new Date(),
      },
      manager,
    );
  }
}
