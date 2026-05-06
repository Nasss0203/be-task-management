import { TaskResponseDto } from '../../dto/response/task-response.dto';

export interface FindTaskApplication {
  findAllTask(
    projectId: string,
    workspaceId: string,
  ): Promise<TaskResponseDto[]>;

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
