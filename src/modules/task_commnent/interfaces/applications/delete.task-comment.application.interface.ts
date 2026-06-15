export interface DeleteTaskCommentApplicationInput {
  workspaceId: string;
  projectId: string;
  taskId: string;
  commentId: string;
  userId: string;
}

export interface DeleteTaskCommentApplication {
  delete(input: DeleteTaskCommentApplicationInput): Promise<void>;
}
