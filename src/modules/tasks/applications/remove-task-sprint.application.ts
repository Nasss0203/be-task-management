import { Inject, Injectable } from '@nestjs/common';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import {
  RemoveTaskFromSprintApplication,
  RemoveTaskFromSprintApplicationInput,
} from '../interfaces/applications/remove-task-sprint.application.interface';
import { type RemoveTaskFromSprintService } from '../interfaces/services/remove-task-sprint.service.interface';
import { TASK_TYPES } from '../interfaces/types';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class RemoveTaskFromSprintApplicationImpl implements RemoveTaskFromSprintApplication {
  constructor(
    @Inject(TASK_TYPES.services.RemoveTaskFromSprintService)
    private readonly removeTaskFromSprintService: RemoveTaskFromSprintService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async remove(
    input: RemoveTaskFromSprintApplicationInput,
  ): Promise<TaskResponseDto> {
    const task = await this.removeTaskFromSprintService.remove({
      taskId: input.taskId,
    });

    await this.createActivityService.create({
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      entityType: ActivityEntityType.TASK,
      entityId: task.id,
      actorId: input.userId,
      action: ActivityAction.TASK_REMOVED_FROM_SPRINT,
      field: 'sprintId',
      newValue: null,
    });

    return TaskMapper.toResponse(task);
  }
}
