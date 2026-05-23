import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  type NotificationCreatedPayload,
  REALTIME_EVENTS,
} from '../realtime.events';
import { RealtimeEmitterService } from '../services/realtime-emitter.service';

@Injectable()
export class NotificationCreatedRealtimeListener {
  constructor(
    private readonly realtimeEmitterService: RealtimeEmitterService,
  ) {}

  @OnEvent(REALTIME_EVENTS.NOTIFICATION_CREATED)
  handle(payload: NotificationCreatedPayload): void {
    this.realtimeEmitterService.emitToUser(
      payload.recipientUserId,
      REALTIME_EVENTS.NOTIFICATION_CREATED,
      payload.notification,
    );
  }
}
