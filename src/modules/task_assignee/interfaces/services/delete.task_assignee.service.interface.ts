export type DeleteTaskAssigneeInput = {
  taskId: string;
  userId: string;
  deletedBy: string;
};

export interface DeleteTaskAssigneeService {
  unassign(input: DeleteTaskAssigneeInput): Promise<void>;
}
