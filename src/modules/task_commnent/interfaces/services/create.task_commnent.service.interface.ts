import { EntityManager } from 'typeorm';
import { TaskCommentModel } from '../../domain/models/task_comment.model';

export type CreateTaskCommentInput = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  authorId: string;
  content: string;
};

export interface CreateTaskCommentService {
  create(
    input: CreateTaskCommentInput,
    manager?: EntityManager,
  ): Promise<TaskCommentModel>;
}
