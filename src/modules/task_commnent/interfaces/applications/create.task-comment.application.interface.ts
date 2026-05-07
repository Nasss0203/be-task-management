import { TaskCommentResponseDto } from '../../dto/response/task-comment.response.dto';

export type CreateTaskCommentApplicationInput = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  userId: string;
  content: string;
};

export interface CreateTaskCommentApplication {
  create(
    input: CreateTaskCommentApplicationInput,
  ): Promise<TaskCommentResponseDto>;
}
