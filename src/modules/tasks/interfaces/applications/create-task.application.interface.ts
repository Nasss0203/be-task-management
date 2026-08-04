import { CreateTaskDto } from '../../dto/create-task.dto';
import { TaskResponseDto } from '../../dto/response/task-response.dto';

export type CreateTaskInput = CreateTaskDto & {
  createdBy: string;
  projectSeq?: number;
};
export interface CreateTaskApplication {
  create(createTaskDto: CreateTaskInput): Promise<TaskResponseDto>;
}
