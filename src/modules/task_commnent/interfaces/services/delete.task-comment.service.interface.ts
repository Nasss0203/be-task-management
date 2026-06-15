export interface DeleteTaskCommentServiceInput {
  workspaceId: string;
  projectId: string;
  taskId: string;
  commentId: string;
  authorId: string;
}

export interface DeleteTaskCommentService {
  delete(input: DeleteTaskCommentServiceInput): Promise<void>;
}
