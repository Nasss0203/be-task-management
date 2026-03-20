import { TaskResponseDto } from '../../dto/response/task.response.dto';

export interface FindTaskApplication {
  findAllTask(
    projectId: string,
    workspaceId: string,
    boardId: string,
  ): Promise<TaskResponseDto[]>;
}
