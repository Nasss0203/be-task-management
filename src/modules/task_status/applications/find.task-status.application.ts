import { Inject, Injectable } from '@nestjs/common';
import { TaskStatusResponseDto } from '../dto/response/task_status.response.dto';
import { FindTaskStatusApplication } from '../interfaces/applications/find.task-status.application.interface';
import { type FindTaskStatusService } from '../interfaces/services/find.task-status.service.interface';
import { TASK_STATUS_TYPES } from '../interfaces/types';
import { TaskStatusMapper } from '../mapper/task_status.mapper';

@Injectable()
export class FindTaskStatusApplicationImpl implements FindTaskStatusApplication {
  constructor(
    @Inject(TASK_STATUS_TYPES.services.FindTaskStatusService)
    private readonly service: FindTaskStatusService,
  ) {}
  async findAllTaskStatus(
    projectId: string,
    workspaceId: string,
  ): Promise<TaskStatusResponseDto[]> {
    const taskStatus = await this.service.findAllTaskStatus(
      projectId,
      workspaceId,
    );
    return taskStatus.map((task_status) =>
      TaskStatusMapper.toResponse(task_status),
    );
  }
}
