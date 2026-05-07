import { EntityManager } from 'typeorm';
import { TaskCommentModel } from '../../domain/models/task_comment.model';
import { SaveTaskCommentInput } from '../../mapper/task_commnent.mapper';

export interface CreateTaskCommentRepository {
  create(
    input: SaveTaskCommentInput,
    manager?: EntityManager,
  ): Promise<TaskCommentModel>;
}
