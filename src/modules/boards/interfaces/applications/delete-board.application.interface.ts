export interface DeleteBoardApplication {
  delete(input: {
    workspaceId: string;
    projectId: string;
    boardId: string;
    userId: string;
  }): Promise<void>;

  restore(input: {
    workspaceId: string;
    projectId: string;
    boardId: string;
    userId: string;
  }): Promise<void>;
}
