import { Inject, Injectable } from '@nestjs/common';
import type { CreateAtTopTaskPositionService } from 'src/modules/task_position/interfaces/services/create-at-top-task-position.service.interface';
import { TASK_POSITION_TYPES } from 'src/modules/task_position/interfaces/types';
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

    @Inject(TASK_POSITION_TYPES.services.CreateAtTopTaskPositionService)
    private readonly createAtTopTaskPositionService: CreateAtTopTaskPositionService,
  ) {}

  async move(
    input: MoveUnfinishedTasksToBacklogServiceInput,
    manager?: EntityManager,
  ): Promise<number> {
    const movedCount = await this.moveUnfinishedTasksToBacklogRepository.move(
      input.workspaceId,
      input.projectId,
      input.sprintId,
      input.doneStatusId,
      manager,
    );

    if (input.incompleteTaskIds && input.incompleteTaskIds.length > 0) {
      for (const taskId of input.incompleteTaskIds) {
        await this.createAtTopTaskPositionService.createAtTop(
          {
            taskId,
            context: 'backlog',
            contextId: input.projectId,
          },
          manager,
        );
      }
    }

    return movedCount;
  }
}
