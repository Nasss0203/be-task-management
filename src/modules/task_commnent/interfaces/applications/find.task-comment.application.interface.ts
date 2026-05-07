import { TaskCommentResponseDto } from '../../dto/response/task-comment.response.dto';

export type FindTaskCommentApplicationInput = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  userId: string;
};

export interface FindTaskCommentApplication {
  findByTaskId(
    input: FindTaskCommentApplicationInput,
  ): Promise<TaskCommentResponseDto[]>;
}
