import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASK_COMMENT_TYPES } from '../interfaces/types';
import { type FindTaskCommentReposiroty } from '../interfaces/repositories/find.task_comment.reposiroty.interface';
import { type DeleteTaskCommentRepository } from '../interfaces/repositories/delete.task-comment.repository.interface';
import { DeleteTaskCommentService, DeleteTaskCommentServiceInput } from '../interfaces/services/delete.task-comment.service.interface';

@Injectable()
export class DeleteTaskCommentServiceImpl implements DeleteTaskCommentService {
  constructor(
    @Inject(TASK_COMMENT_TYPES.repositories.FindTaskCommentReposiroty)
    private readonly findRepo: FindTaskCommentReposiroty,

    @Inject(TASK_COMMENT_TYPES.repositories.DeleteTaskCommentRepository)
    private readonly deleteRepo: DeleteTaskCommentRepository,
  ) { }

  async delete(input: DeleteTaskCommentServiceInput): Promise<void> {
    const comment = await this.findRepo.findById(
      input.workspaceId,
      input.projectId,
      input.taskId,
      input.commentId,
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== input.authorId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.deleteRepo.delete(input.commentId);
  }
}
