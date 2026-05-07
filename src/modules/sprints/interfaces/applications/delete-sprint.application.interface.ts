export interface DeleteSprintApplication {
  delete(input: {
    workspaceId: string;
    projectId: string;
    sprintId: string;
    userId: string;
  }): Promise<void>;

  restore(input: {
    workspaceId: string;
    projectId: string;
    sprintId: string;
    userId: string;
  }): Promise<void>;
}
