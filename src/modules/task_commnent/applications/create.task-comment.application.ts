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

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    private readonly eventEmitter: EventEmitter2,
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

    await this.createActivityService.create({
      workspaceId: comment.workspaceId,
      projectId: comment.projectId,
      entityType: ActivityEntityType.COMMENT,
      entityId: comment.id,
      actorId: input.userId,
      action: ActivityAction.COMMENT_CREATED,
      metadata: {
        taskId: comment.taskId,
      },
    });

    this.eventEmitter.emit(REALTIME_EVENTS.COMMENT_CREATED, {
      workspaceId: comment.workspaceId,
      projectId: comment.projectId,
      taskId: comment.taskId,
      comment: comment,
    });

    return TaskCommentMapper.toResponse(comment);
  }
}
