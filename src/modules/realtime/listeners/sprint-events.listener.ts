import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { REALTIME_EVENTS, type SprintCreatedPayload, type SprintUpdatedPayload, type SprintDeletedPayload } from '../realtime.events';
import { RealtimeEmitterService } from '../services/realtime-emitter.service';

@Injectable()
export class SprintEventsListener {
  constructor(private readonly realtimeEmitterService: RealtimeEmitterService) {}

  @OnEvent(REALTIME_EVENTS.SPRINT_CREATED)
  handleCreated(payload: SprintCreatedPayload): void {
    this.realtimeEmitterService.emitToProject(
      payload.projectId,
      REALTIME_EVENTS.SPRINT_CREATED,
      payload.sprint,
    );
  }

  @OnEvent(REALTIME_EVENTS.SPRINT_UPDATED)
  handleUpdated(payload: SprintUpdatedPayload): void {
    this.realtimeEmitterService.emitToProject(
      payload.projectId,
      REALTIME_EVENTS.SPRINT_UPDATED,
      payload.sprint,
    );
  }

  @OnEvent(REALTIME_EVENTS.SPRINT_DELETED)
  handleDeleted(payload: SprintDeletedPayload): void {
    this.realtimeEmitterService.emitToProject(
      payload.projectId,
      REALTIME_EVENTS.SPRINT_DELETED,
      { sprintId: payload.sprintId },
    );
  }
}
