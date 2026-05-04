export interface DeleteTaskApplication {
  delete(input: {
    workspaceId: string;
    taskId: string;
    userId: string;
  }): Promise<void>;

  restore(input: {
    workspaceId: string;
    taskId: string;
    userId: string;
  }): Promise<void>;
}
