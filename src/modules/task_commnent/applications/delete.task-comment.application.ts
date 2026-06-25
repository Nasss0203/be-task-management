import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import {
  DeleteTaskCommentApplication,
  DeleteTaskCommentApplicationInput,
} from '../interfaces/applications/delete.task-comment.application.interface';
import { type DeleteTaskCommentService } from '../interfaces/services/delete.task-comment.service.interface';
import { TASK_COMMENT_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteTaskCommentApplicationImpl implements DeleteTaskCommentApplication {
  constructor(
    @Inject(TASK_COMMENT_TYPES.services.DeleteTaskCommentService)
    private readonly deleteTaskCommentService: DeleteTaskCommentService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async delete(
    input: DeleteTaskCommentApplicationInput,
  ): Promise<void> {
    await this.deleteTaskCommentService.delete({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      taskId: input.taskId,
      commentId: input.commentId,
      authorId: input.userId,
    });

    await this.createActivityService.create({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      entityType: ActivityEntityType.COMMENT,
      entityId: input.commentId,
      actorId: input.userId,
      action: ActivityAction.COMMENT_DELETED,
      metadata: {
        taskId: input.taskId,
      },
    });

    this.eventEmitter.emit(REALTIME_EVENTS.COMMENT_DELETED, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      taskId: input.taskId,
      commentId: input.commentId,
    });
  }
}
