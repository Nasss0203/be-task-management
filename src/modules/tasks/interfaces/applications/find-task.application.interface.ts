import {
  PaginatedTaskResponseDto,
  TaskResponseDto,
} from '../../dto/response/task-response.dto';
import { FindBacklogTasksFilters } from '../find-backlog-tasks-filters.interface';

export interface FindTaskApplication {
  findAllTask(
    projectId: string,
    workspaceId: string,
    filters?: FindBacklogTasksFilters,
  ): Promise<TaskResponseDto[]>;

  findOneTask(taskId: string): Promise<TaskResponseDto | null>;

  findDeletedTasks(
    workspaceId: string,
    projectId?: string,
  ): Promise<TaskResponseDto[]>;

  findBacklogTasks(
    projectId: string,
    workspaceId: string,
    filters?: FindBacklogTasksFilters,
  ): Promise<PaginatedTaskResponseDto>;
}
