import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASK_COMMENT_TYPES } from '../interfaces/types';
import { FindTaskCommentReposiroty } from '../interfaces/repositories/find.task_comment.reposiroty.interface';
import { UpdateTaskCommentRepository } from '../interfaces/repositories/update.task-comment.repository.interface';
import { UpdateTaskCommentService, UpdateTaskCommentServiceInput } from '../interfaces/services/update.task-comment.service.interface';
import { TaskCommentModel } from '../domain/models/task_comment.model';

@Injectable()
export class UpdateTaskCommentServiceImpl implements UpdateTaskCommentService {
  constructor(
    @Inject(TASK_COMMENT_TYPES.repositories.FindTaskCommentReposiroty)
    private readonly findRepo: FindTaskCommentReposiroty,
    
    @Inject(TASK_COMMENT_TYPES.repositories.UpdateTaskCommentRepository)
    private readonly updateRepo: UpdateTaskCommentRepository,
  ) {}

  async update(input: UpdateTaskCommentServiceInput): Promise<TaskCommentModel> {
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
      throw new ForbiddenException('You can only edit your own comments');
    }

    await this.updateRepo.update(input.commentId, input.content);

    const updatedComment = await this.findRepo.findById(
      input.workspaceId,
      input.projectId,
      input.taskId,
      input.commentId,
    );

    return updatedComment!;
  }
}
