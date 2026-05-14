import { TaskResponseDto } from '../../dto/response/task-response.dto';

export type RemoveTaskFromSprintApplicationInput = {
  taskId: string;
  userId: string;
};

export interface RemoveTaskFromSprintApplication {
  remove(input: RemoveTaskFromSprintApplicationInput): Promise<TaskResponseDto>;
}
