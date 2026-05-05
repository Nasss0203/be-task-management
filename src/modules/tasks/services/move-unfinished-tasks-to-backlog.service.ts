import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type MoveUnfinishedTasksToBacklogRepository } from '../interfaces/repositories/move-unfinished-tasks-to-backlog.repository.interface';
import {
  MoveUnfinishedTasksToBacklogService,
  MoveUnfinishedTasksToBacklogServiceInput,
} from '../interfaces/services/move-unfinished-tasks-to-backlog.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class MoveUnfinishedTasksToBacklogServiceImpl implements MoveUnfinishedTasksToBacklogService {
  constructor(
    @Inject(TASK_TYPES.repositories.MoveUnfinishedTasksToBacklogRepository)
    private readonly moveUnfinishedTasksToBacklogRepository: MoveUnfinishedTasksToBacklogRepository,
  ) {}

  async move(
    input: MoveUnfinishedTasksToBacklogServiceInput,
    manager?: EntityManager,
  ): Promise<number> {
    return this.moveUnfinishedTasksToBacklogRepository.move(
      input.workspaceId,
      input.projectId,
      input.sprintId,
      input.doneStatusId,
      manager,
    );
  }
}
