import { TaskResponseDto } from '../../dto/response/task-response.dto';
import { UpdateTaskDto } from '../../dto/update-task.dto';

export interface UpdateTaskApplication {
  updateTask(updateTaskDto: UpdateTaskDto): Promise<TaskResponseDto>;
}
