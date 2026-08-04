import { TaskCommentResponseDto } from '../../dto/response/task-comment.response.dto';

export interface UpdateTaskCommentApplicationInput {
  workspaceId: string;
  projectId: string;
  taskId: string;
  commentId: string;
  userId: string;
  content: string;
}

export interface UpdateTaskCommentApplication {
  update(
    input: UpdateTaskCommentApplicationInput,
  ): Promise<TaskCommentResponseDto>;
}
