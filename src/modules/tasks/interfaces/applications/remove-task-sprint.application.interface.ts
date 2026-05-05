import { TaskResponseDto } from '../../dto/response/task-response.dto';

export type RemoveTaskFromSprintApplicationInput = {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  taskId: string;
  userId: string;
};

export interface RemoveTaskFromSprintApplication {
  remove(input: RemoveTaskFromSprintApplicationInput): Promise<TaskResponseDto>;
}
