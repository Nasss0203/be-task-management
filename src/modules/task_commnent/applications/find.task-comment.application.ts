import { Inject, Injectable } from '@nestjs/common';
import { TaskCommentResponseDto } from '../dto/response/task-comment.response.dto';
import {
  FindTaskCommentApplication,
  FindTaskCommentApplicationInput,
} from '../interfaces/applications/find.task-comment.application.interface';
import { type FindTaskCommentService } from '../interfaces/services/find.task_comment.reposiroty.interface';
import { TASK_COMMENT_TYPES } from '../interfaces/types';
import { TaskCommentMapper } from '../mapper/task_commnent.mapper';

@Injectable()
export class FindTaskCommentApplicationImpl implements FindTaskCommentApplication {
  constructor(
    @Inject(TASK_COMMENT_TYPES.services.FindTaskCommentService)
    private readonly findTaskCommentService: FindTaskCommentService,
  ) {}

  async findByTaskId(
    input: FindTaskCommentApplicationInput,
  ): Promise<TaskCommentResponseDto[]> {
    const comments = await this.findTaskCommentService.findByTaskId({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      taskId: input.taskId,
      userId: input.userId,
    });

    return TaskCommentMapper.toResponseList(comments);
  }
}
