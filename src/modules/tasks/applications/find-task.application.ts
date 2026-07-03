import { Inject, Injectable } from '@nestjs/common';
import {
  PaginatedTaskResponseDto,
  TaskResponseDto,
} from '../dto/response/task-response.dto';
import { FindTaskApplication } from '../interfaces/applications/find-task.application.interface';
import { FindBacklogTasksFilters } from '../interfaces/find-backlog-tasks-filters.interface';
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
    filters?: FindBacklogTasksFilters,
  ): Promise<PaginatedTaskResponseDto> {
    const result = await this.service.findAllTask(projectId, workspaceId, filters);
    return {
      data: result.data.map((task) => TaskMapper.toResponse(task)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  async findBacklogTasks(
    projectId: string,
    workspaceId: string,
    filters?: FindBacklogTasksFilters,
  ): Promise<PaginatedTaskResponseDto> {
    const result = await this.service.findBacklogTasks(
      projectId,
      workspaceId,
      filters,
    );

    return {
      data: result.data.map((task) => TaskMapper.toResponse(task)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  async findOneTask(taskId: string): Promise<TaskResponseDto | null> {
    const tasks = await this.service.findOneTask(taskId);

    if (!tasks) {
      return null;
    }

    return TaskMapper.toResponse(tasks);
  }

  async findDeletedTasks(
    workspaceId: string,
    projectId?: string,
  ): Promise<TaskResponseDto[]> {
    const tasks = await this.service.findDeletedTasks(workspaceId, projectId);

    return tasks.map(TaskMapper.toResponse);
  }
}
