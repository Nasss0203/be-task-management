import { CreateTaskDto } from '../../dto/create-task.dto';
import { TaskResponseDto } from '../../dto/response/task.response.dto';

export interface CreateTaskApplication {
  create(createTaskDto: CreateTaskDto): Promise<TaskResponseDto>;
}
