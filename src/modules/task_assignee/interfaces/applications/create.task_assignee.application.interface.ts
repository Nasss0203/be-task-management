import { CreateTaskAssigneeDto } from '../../dto/create-task_assignee.dto';
import { TaskAssigneeResponseDto } from '../../dto/response/task_assignee.response.dto';

export interface CreateTaskAssigneeApplication {
  assign(input: CreateTaskAssigneeDto): Promise<TaskAssigneeResponseDto>;
}
