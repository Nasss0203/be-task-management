// src/modules/tasks/services/move-tasks-to-backlog-by-sprint.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type MoveTasksToBacklogBySprintRepository } from '../interfaces/repositories/move-tasks-to-backlog-by-sprint.repository.interface';
import {
  MoveTasksToBacklogBySprintInput,
  MoveTasksToBacklogBySprintService,
} from '../interfaces/services/move-tasks-to-backlog-by-sprint.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class MoveTasksToBacklogBySprintServiceImpl implements MoveTasksToBacklogBySprintService {
  constructor(
    @Inject(TASK_TYPES.repositories.MoveTasksToBacklogBySprintRepository)
    private readonly repo: MoveTasksToBacklogBySprintRepository,
  ) {}

  async move(
    input: MoveTasksToBacklogBySprintInput,
    manager?: EntityManager,
  ): Promise<void> {
    await this.repo.move(input, manager);
  }
}
