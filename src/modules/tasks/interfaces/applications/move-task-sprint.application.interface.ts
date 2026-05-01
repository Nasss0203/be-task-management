import { TaskResponseDto } from '../../dto/response/task-response.dto';

export interface MoveTaskSprintApplicationInput {
  taskId: string;
  sprintId: string | null;
  userId: string;
}

export interface MoveTaskSprintApplication {
  move(input: MoveTaskSprintApplicationInput): Promise<TaskResponseDto>;
}
