import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { REALTIME_EVENTS, type TaskCreatedPayload, type TaskUpdatedPayload, type TaskDeletedPayload } from '../realtime.events';
import { RealtimeEmitterService } from '../services/realtime-emitter.service';

@Injectable()
export class TaskEventsListener {
  constructor(private readonly realtimeEmitterService: RealtimeEmitterService) {}

  @OnEvent(REALTIME_EVENTS.TASK_CREATED)
  handleCreated(payload: TaskCreatedPayload): void {
    this.realtimeEmitterService.emitToProject(
      payload.projectId,
      REALTIME_EVENTS.TASK_CREATED,
      payload.task,
    );
  }

  @OnEvent(REALTIME_EVENTS.TASK_UPDATED)
  handleUpdated(payload: TaskUpdatedPayload): void {
    this.realtimeEmitterService.emitToProject(
      payload.projectId,
      REALTIME_EVENTS.TASK_UPDATED,
      payload.task,
    );
  }

  @OnEvent(REALTIME_EVENTS.TASK_DELETED)
  handleDeleted(payload: TaskDeletedPayload): void {
    this.realtimeEmitterService.emitToProject(
      payload.projectId,
      REALTIME_EVENTS.TASK_DELETED,
      { taskId: payload.taskId },
    );
  }
}
