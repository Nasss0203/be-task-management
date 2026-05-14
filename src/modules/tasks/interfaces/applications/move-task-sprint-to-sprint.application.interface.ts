import { TaskResponseDto } from '../../dto/response/task-response.dto';

export interface MoveTaskSprintToSprintApplicationInput {
  workspaceId: string;
  projectId: string;
  taskId: string;
  sourceSprintId: string;
  targetSprintId: string;
}

export interface MoveTaskSprintToSprintApplication {
  move(input: MoveTaskSprintToSprintApplicationInput): Promise<TaskResponseDto>;
}
