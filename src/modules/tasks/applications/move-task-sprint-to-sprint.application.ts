import { Inject, Injectable } from '@nestjs/common';

import {
  MoveTaskSprintToSprintApplication,
  MoveTaskSprintToSprintApplicationInput,
} from '../interfaces/applications/move-task-sprint-to-sprint.application.interface';
import { TASK_TYPES } from '../interfaces/types';

import { type UnitOfWork } from 'src/interface/index.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import { type MoveTaskSprintToSprintService } from '../interfaces/services/move-task-sprint-to-sprint.service.interface';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class MoveTaskSprintToSprintApplicationImpl implements MoveTaskSprintToSprintApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,
    @Inject(TASK_TYPES.services.MoveTaskSprintToSprintService)
    private readonly moveTaskSprintToSprintService: MoveTaskSprintToSprintService,
  ) {}

  async move(
    input: MoveTaskSprintToSprintApplicationInput,
  ): Promise<TaskResponseDto> {
    const task = await this.moveTaskSprintToSprintService.move(input);
    console.log('🚀 ~ task~', task);

    return TaskMapper.toResponse(task);
  }
}
