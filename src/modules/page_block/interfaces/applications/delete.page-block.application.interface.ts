export interface DeletePageBlockApplication {
  delete(input: {
    workspaceId: string;
    blockId: string;
    userId: string;
  }): Promise<void>;

  restore(input: {
    workspaceId: string;
    blockId: string;
    userId: string;
  }): Promise<void>;
}
