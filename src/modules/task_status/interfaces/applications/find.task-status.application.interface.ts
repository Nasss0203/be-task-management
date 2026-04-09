import { TaskStatusResponseDto } from '../../dto/response/task_status.response.dto';

export interface FindTaskStatusApplication {
  findAllTaskStatus(
    projectId: string,
    workspaceId: string,
  ): Promise<TaskStatusResponseDto[]>;
}
