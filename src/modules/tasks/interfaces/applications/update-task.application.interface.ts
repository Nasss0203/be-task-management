import { TaskResponseDto } from '../../dto/response/task-response.dto';
import { UpdateManyTasksDto } from '../../dto/update-many-tasks.dto';
import { UpdateTaskDto } from '../../dto/update-task.dto';

export interface UpdateManyTasksApplicationInput {
  workspaceId: string;
  projectId: string;
  dto: UpdateManyTasksDto;
}

export interface UpdateTaskApplication {
  updateTask(updateTaskDto: UpdateTaskDto): Promise<TaskResponseDto>;

  updateManyTasks(
    input: UpdateManyTasksApplicationInput,
  ): Promise<TaskResponseDto[]>;
}
