import { FindTaskQueryDto } from '../../dto/find-task-query.dto';
import { PaginatedResponseDto } from '../../dto/paginated-response.dto';
import { TaskResponseDto } from '../../dto/response/task-response.dto';

export interface FindTaskApplication {
  findAllTask(
    projectId: string,
    workspaceId: string,
    query: FindTaskQueryDto,
  ): Promise<PaginatedResponseDto<TaskResponseDto>>;

  findOneTask(taskId: string): Promise<TaskResponseDto | null>;

  findDeletedTasks(
    workspaceId: string,
    projectId?: string,
  ): Promise<TaskResponseDto[]>;

  findBacklogTasks(
    projectId: string,
    workspaceId: string,
  ): Promise<TaskResponseDto[]>;
}
