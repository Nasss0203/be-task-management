import { TaskCommentModel } from '../../domain/models/task_comment.model';

export interface UpdateTaskCommentServiceInput {
  workspaceId: string;
  projectId: string;
  taskId: string;
  commentId: string;
  authorId: string;
  content: string;
}

export interface UpdateTaskCommentService {
  update(input: UpdateTaskCommentServiceInput): Promise<TaskCommentModel>;
}
