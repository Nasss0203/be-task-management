import { Inject, Injectable } from '@nestjs/common';
import { FindTaskQueryDto } from '../dto/find-task-query.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { TaskResponseDto } from '../dto/response/task-response.dto';
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
    query: FindTaskQueryDto,
  ): Promise<PaginatedResponseDto<TaskResponseDto>> {
    const result = await this.service.findAllTask(
      projectId,
      workspaceId,
      query,
    );

    return {
      data: result.data.map((task) => TaskMapper.toResponse(task)),
      meta: result.meta,
    };
  }

  async findBacklogTasks(
    projectId: string,
    workspaceId: string,
  ): Promise<TaskResponseDto[]> {
    const tasks = await this.service.findBacklogTasks(projectId, workspaceId);
    return tasks.map((task) => TaskMapper.toResponse(task));
  }

  async findOneTask(taskId: string): Promise<TaskResponseDto | null> {
    const task = await this.service.findOneTask(taskId);

    if (!task) {
      return null;
    }

    return TaskMapper.toResponse(task);
  }

  async findDeletedTasks(
    workspaceId: string,
    projectId?: string,
  ): Promise<TaskResponseDto[]> {
    const tasks = await this.service.findDeletedTasks(workspaceId, projectId);

    return tasks.map(TaskMapper.toResponse);
  }
}
