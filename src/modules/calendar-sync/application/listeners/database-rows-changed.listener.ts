import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  DATABASE_ROWS_CHANGED_EVENT,
  type DatabaseRowsChangedEvent,
} from 'src/modules/database/application/ports/database-row-change-publisher.port';

import { CALENDAR_SYNC_TYPES } from '../../calendar-sync.types';
import type { GoogleCalendarSyncRepository } from '../../domain/repositories/google-calendar-sync.repository';
import type { GoogleCalendarSyncJobQueue } from '../ports/google-calendar-sync-job-queue.port';

export const ROW_CHANGE_SYNC_DELAY_MS = 5000;

@Injectable()
export class DatabaseRowsChangedListener {
  private readonly logger = new Logger(DatabaseRowsChangedListener.name);

  constructor(
    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarSyncRepository)
    private readonly syncRepository: GoogleCalendarSyncRepository,

    @Inject(CALENDAR_SYNC_TYPES.ports.GoogleCalendarSyncJobQueue)
    private readonly jobQueue: GoogleCalendarSyncJobQueue,
  ) {}

  @OnEvent(DATABASE_ROWS_CHANGED_EVENT, { async: true })
  async handle(event: DatabaseRowsChangedEvent): Promise<void> {
    try {
      const syncIds = await this.syncRepository.findIdsByDatabaseId(
        event.databaseId,
      );

      for (const syncId of syncIds) {
        await this.jobQueue.enqueue(syncId, {
          delayMs: ROW_CHANGE_SYNC_DELAY_MS,
        });
      }
    } catch (error) {
      this.logger.warn(
        `Google Calendar sync was not queued after a row change: ${(error as Error).message}`,
      );
    }
  }
}
