import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { REALTIME_EVENTS, type TaskUpdatedPayload } from '../realtime.events';
import { RealtimeEmitterService } from '../services/realtime-emitter.service';

@Injectable()
export class TaskUpdatedRealtimeListener {
  constructor(
    private readonly realtimeEmitterService: RealtimeEmitterService,
  ) {}

  @OnEvent(REALTIME_EVENTS.TASK_UPDATED)
  handle(payload: TaskUpdatedPayload): void {
    this.realtimeEmitterService.emitToProject(
      payload.projectId,
      REALTIME_EVENTS.TASK_UPDATED,
      payload.task,
    );
  }
}
