import { TaskAssigneeResponseDto } from '../../dto/response/task_assignee.response.dto';

export type CreateTaskAssigneeApplicationInput = {
  taskId: string;
  userId: string;
  assignedBy: string;
};

export interface CreateTaskAssigneeApplication {
  assign(
    input: CreateTaskAssigneeApplicationInput,
  ): Promise<TaskAssigneeResponseDto>;
}
