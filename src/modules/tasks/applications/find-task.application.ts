import { Inject, Injectable } from '@nestjs/common';
import { TaskResponseDto } from '../dto/response/task.response.dto';
import { FindTaskApplication } from '../interfaces/applications/find-task.application.interface';
import { type FindTaskService } from '../interfaces/services/find-task.service.interface';
import { TASK_TYPES } from '../interfaces/types';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class FindTaskApplicationImpl implements FindTaskApplication {
  constructor(
    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly service: FindTaskService,
  ) {}

  async findAllTask(
    projectId: string,
    workspaceId: string,
  ): Promise<TaskResponseDto[]> {
    const tasks = await this.service.findAllTask(projectId, workspaceId);
    return tasks.map((task) => TaskMapper.toResponse(task));
  }
}
