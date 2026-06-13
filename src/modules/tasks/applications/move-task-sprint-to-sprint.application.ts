import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';

import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import {
  MoveTaskSprintToSprintApplication,
  MoveTaskSprintToSprintApplicationInput,
} from '../interfaces/applications/move-task-sprint-to-sprint.application.interface';
import { type MoveTaskSprintToSprintService } from '../interfaces/services/move-task-sprint-to-sprint.service.interface';
import { TASK_TYPES } from '../interfaces/types';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class MoveTaskSprintToSprintApplicationImpl
  implements MoveTaskSprintToSprintApplication
{
  constructor(
    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(TASK_TYPES.services.MoveTaskSprintToSprintService)
    private readonly moveTaskSprintToSprintService: MoveTaskSprintToSprintService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async move(
    input: MoveTaskSprintToSprintApplicationInput,
  ): Promise<TaskResponseDto> {
    const task = await this.uow.runInTransaction(async (manager) => {
      const movedTask = await this.moveTaskSprintToSprintService.move(
        input,
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId: movedTask.workspaceId,
          projectId: movedTask.projectId,
          entityType: ActivityEntityType.TASK,
          entityId: movedTask.id,
          actorId: input.userId,
          action: ActivityAction.TASK_MOVED_TO_SPRINT,
          field: 'sprintId',
          oldValue: input.sourceSprintId,
          newValue: input.targetSprintId,
        },
        manager,
      );

      this.eventEmitter.emit(REALTIME_EVENTS.TASK_UPDATED, {
        workspaceId: movedTask.workspaceId,
        projectId: movedTask.projectId,
        task: movedTask,
      });

      return movedTask;
    });

    return TaskMapper.toResponse(task);
  }
}
