import { TaskResponseDto } from '../../dto/response/task-response.dto';
import { UpdateManyTasksDto } from '../../dto/update-many-tasks.dto';
import { UpdateTaskDto } from '../../dto/update-task.dto';

export type UpdateTaskInput = UpdateTaskDto & {
  id: string;
  actorId: string;
};

export interface UpdateManyTasksApplicationInput {
  workspaceId: string;
  projectId: string;
  actorId: string;
  dto: UpdateManyTasksDto;
}

export interface UpdateTaskApplication {
  updateTask(updateTaskDto: UpdateTaskInput): Promise<TaskResponseDto>;

  updateManyTasks(
    input: UpdateManyTasksApplicationInput,
  ): Promise<TaskResponseDto[]>;
}
