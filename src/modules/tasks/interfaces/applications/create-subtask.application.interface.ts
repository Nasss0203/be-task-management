import { CreateSubtaskDto } from '../../dto/create-subtask.dto';
import { TaskResponseDto } from '../../dto/response/task-response.dto';

export type CreateSubtaskInput = CreateSubtaskDto & {
  parentTaskId: string;
  createdBy: string;
};

export interface CreateSubtaskApplication {
  create(input: CreateSubtaskInput): Promise<TaskResponseDto>;
}
