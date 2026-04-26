import { Inject, Injectable } from '@nestjs/common';
import { TaskAssigneeResponseDto } from '../dto/response/task_assignee.response.dto';
import { CreateTaskAssigneeApplication } from '../interfaces/applications/create.task_assignee.application.interface';

import { CreateTaskAssigneeDto } from '../dto/create-task_assignee.dto';
import { type CreateTaskAssigneeService } from '../interfaces/services/create.task_assignee.service.interface';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';
import { TaskAssigneeMapper } from '../mapper/task_assignee.mapper';

@Injectable()
export class CreateTaskAssigneeApplicationImpl implements CreateTaskAssigneeApplication {
  constructor(
    @Inject(TASK_ASSIGNEE_TYPES.services.CreateTaskAssigneeService)
    private readonly createTaskAssigneeService: CreateTaskAssigneeService,
  ) {}

  async assign(input: CreateTaskAssigneeDto): Promise<TaskAssigneeResponseDto> {
    // Transaction db
    // todo: Check user member trong workspace không
    const result = await this.createTaskAssigneeService.assign({
      taskId: input.taskId,
      userId: input.userId,
      assignedBy: input.assignedBy,
    });

    return TaskAssigneeMapper.toResponse(result);
  }
}
