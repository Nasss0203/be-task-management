import { EntityManager } from 'typeorm';
import { TaskCommentModel } from '../../domain/models/task_comment.model';

export interface FindTaskCommentReposiroty {
  findByTaskId(
    workspaceId: string,
    projectId: string,
    taskId: string,
    manager?: EntityManager,
  ): Promise<TaskCommentModel[]>;

  findById(
    workspaceId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    manager?: EntityManager,
  ): Promise<TaskCommentModel | null>;
}
