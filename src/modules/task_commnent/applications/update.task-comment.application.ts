import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { TaskCommentResponseDto } from '../dto/response/task-comment.response.dto';
import {
  UpdateTaskCommentApplication,
  UpdateTaskCommentApplicationInput,
} from '../interfaces/applications/update.task-comment.application.interface';
import { type UpdateTaskCommentService } from '../interfaces/services/update.task-comment.service.interface';
import { TASK_COMMENT_TYPES } from '../interfaces/types';
import { TaskCommentMapper } from '../mapper/task_commnent.mapper';

@Injectable()
export class UpdateTaskCommentApplicationImpl implements UpdateTaskCommentApplication {
  constructor(
    @Inject(TASK_COMMENT_TYPES.services.UpdateTaskCommentService)
    private readonly updateTaskCommentService: UpdateTaskCommentService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async update(
    input: UpdateTaskCommentApplicationInput,
  ): Promise<TaskCommentResponseDto> {
    const comment = await this.updateTaskCommentService.update({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      taskId: input.taskId,
      commentId: input.commentId,
      authorId: input.userId,
      content: input.content,
    });

    await this.createActivityService.create({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      entityType: ActivityEntityType.COMMENT,
      entityId: input.commentId,
      actorId: input.userId,
      action: ActivityAction.COMMENT_UPDATED,
      metadata: {
        taskId: input.taskId,
      },
    });

    this.eventEmitter.emit(REALTIME_EVENTS.COMMENT_UPDATED, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      taskId: input.taskId,
      comment: comment,
    });

    return TaskCommentMapper.toResponse(comment);
  }
}
