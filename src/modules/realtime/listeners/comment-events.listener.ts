import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { REALTIME_EVENTS, type CommentCreatedPayload, type CommentUpdatedPayload, type CommentDeletedPayload } from '../realtime.events';
import { RealtimeEmitterService } from '../services/realtime-emitter.service';

@Injectable()
export class CommentEventsListener {
  constructor(private readonly realtimeEmitterService: RealtimeEmitterService) {}

  @OnEvent(REALTIME_EVENTS.COMMENT_CREATED)
  handleCreated(payload: CommentCreatedPayload): void {
    this.realtimeEmitterService.emitToProject(
      payload.projectId,
      REALTIME_EVENTS.COMMENT_CREATED,
      payload.comment,
    );
  }

  @OnEvent(REALTIME_EVENTS.COMMENT_UPDATED)
  handleUpdated(payload: CommentUpdatedPayload): void {
    this.realtimeEmitterService.emitToProject(
      payload.projectId,
      REALTIME_EVENTS.COMMENT_UPDATED,
      payload.comment,
    );
  }

  @OnEvent(REALTIME_EVENTS.COMMENT_DELETED)
  handleDeleted(payload: CommentDeletedPayload): void {
    this.realtimeEmitterService.emitToProject(
      payload.projectId,
      REALTIME_EVENTS.COMMENT_DELETED,
      { commentId: payload.commentId, taskId: payload.taskId },
    );
  }
}
