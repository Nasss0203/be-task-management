import { DeleteTaskAssigneeResponseDto } from '../../dto/response/task_assignee.response.dto';

export type DeleteTaskAssigneeApplicationInput = {
  taskId: string;
  userId: string;
  deletedBy: string;
};

export interface DeleteTaskAssigneeApplication {
  unassign(
    input: DeleteTaskAssigneeApplicationInput,
  ): Promise<DeleteTaskAssigneeResponseDto>;
}
