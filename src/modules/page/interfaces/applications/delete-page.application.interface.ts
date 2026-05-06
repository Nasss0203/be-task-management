export interface DeletePageApplication {
  delete(input: {
    workspaceId: string;
    pageId: string;
    userId: string;
  }): Promise<void>;

  restore(input: {
    workspaceId: string;
    pageId: string;
    userId: string;
  }): Promise<void>;
}
