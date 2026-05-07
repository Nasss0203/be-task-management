import { Inject, Injectable } from '@nestjs/common';
import { TaskCommentResponseDto } from '../dto/response/task-comment.response.dto';
import {
  CreateTaskCommentApplication,
  CreateTaskCommentApplicationInput,
} from '../interfaces/applications/create.task-comment.application.interface';
import { type CreateTaskCommentService } from '../interfaces/services/create.task_commnent.service.interface';
import { TASK_COMMENT_TYPES } from '../interfaces/types';
import { TaskCommentMapper } from '../mapper/task_commnent.mapper';

@Injectable()
export class CreateTaskCommentApplicationImpl implements CreateTaskCommentApplication {
  constructor(
    @Inject(TASK_COMMENT_TYPES.services.CreateTaskCommentService)
    private readonly createTaskCommentService: CreateTaskCommentService,
  ) {}

  async create(
    input: CreateTaskCommentApplicationInput,
  ): Promise<TaskCommentResponseDto> {
    const comment = await this.createTaskCommentService.create({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      taskId: input.taskId,
      authorId: input.userId,
      content: input.content,
    });

    return TaskCommentMapper.toResponse(comment);
  }
}
