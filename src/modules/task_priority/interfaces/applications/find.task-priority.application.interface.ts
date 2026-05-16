import { TaskPriorityResponseDto } from '../../dto/response/task_priority.response.dto';

export interface FindTaskPriorityApplication {
  findAllTaskPriority(
    projectId: string,
    workspaceId: string,
  ): Promise<TaskPriorityResponseDto[]>;

  findDonePriority(
    projectId: string,
    workspaceId: string,
  ): Promise<TaskPriorityResponseDto | null>;
}
