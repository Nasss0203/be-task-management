import { TaskCommentModel } from '../../domain/models/task_comment.model';
export type FindTaskCommentInput = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  userId: string;
};
export interface FindTaskCommentService {
  findByTaskId(input: FindTaskCommentInput): Promise<TaskCommentModel[]>;
}
