import { Inject, Injectable } from '@nestjs/common';
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
  ) {}

  async remove(
    input: RemoveTaskFromSprintApplicationInput,
  ): Promise<TaskResponseDto> {
    const task = await this.removeTaskFromSprintService.remove({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      sprintId: input.sprintId,
      taskId: input.taskId,
    });

    return TaskMapper.toResponse(task);
  }
}
