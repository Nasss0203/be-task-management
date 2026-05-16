import { Inject, Injectable } from '@nestjs/common';
import { TaskPriorityResponseDto } from '../dto/response/task_priority.response.dto';
import { FindTaskPriorityApplication } from '../interfaces/applications/find.task-priority.application.interface';
import { type FindTaskPriorityService } from '../interfaces/services/find.task-priority.service.interface';
import { TASK_PRIORITY_TYPES } from '../interfaces/types';
import { TaskPriorityMapper } from '../mapper/task_priority.mapper';

@Injectable()
export class FindTaskPriorityApplicationImpl implements FindTaskPriorityApplication {
  constructor(
    @Inject(TASK_PRIORITY_TYPES.services.FindTaskPriorityService)
    private readonly findTaskPriorityService: FindTaskPriorityService,
  ) {}

  async findAllTaskPriority(
    projectId: string,
    workspaceId: string,
  ): Promise<TaskPriorityResponseDto[]> {
    const priorities = await this.findTaskPriorityService.findAllTaskPriority(
      projectId,
      workspaceId,
    );

    return priorities.map(TaskPriorityMapper.toResponse);
  }

  async findDonePriority(
    projectId: string,
    workspaceId: string,
  ): Promise<TaskPriorityResponseDto | null> {
    const priority = await this.findTaskPriorityService.findDonePriority(
      projectId,
      workspaceId,
    );

    return priority ? TaskPriorityMapper.toResponse(priority) : null;
  }
}
