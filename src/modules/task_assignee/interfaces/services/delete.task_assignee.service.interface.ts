export type DeleteTaskAssigneeInput = {
  taskId: string;
  userId: string;
  deletedBy: string;
};

export interface DeleteTaskAssigneeService {
  unassign(input: DeleteTaskAssigneeInput): Promise<void>;
  unassignFromWorkspace(
    userId: string,
    workspaceId: string,
    manager?: any,
  ): Promise<void>;
}
