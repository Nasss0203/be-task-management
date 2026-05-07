export interface DeleteProjectApplication {
  delete(input: {
    workspaceId: string;
    projectId: string;
    userId: string;
  }): Promise<void>;

  restore(input: {
    workspaceId: string;
    projectId: string;
    userId: string;
  }): Promise<void>;
}
