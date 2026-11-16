import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  DATABASE_ROWS_CHANGED_EVENT,
  type DatabaseRowChangePublisher,
  type DatabaseRowsChangedEvent,
} from '../../application/ports/database-row-change-publisher.port';

@Injectable()
export class EventEmitterDatabaseRowChangePublisher implements DatabaseRowChangePublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(databaseId: string): void {
    const event: DatabaseRowsChangedEvent = { databaseId };
    this.eventEmitter.emit(DATABASE_ROWS_CHANGED_EVENT, event);
  }
}
