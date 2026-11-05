import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bullmq';

import type { GoogleCalendarSyncJobQueue } from '../../application/ports/google-calendar-sync-job-queue.port';
import {
  GOOGLE_CALENDAR_SYNC_QUEUE,
  RUN_GOOGLE_CALENDAR_SYNC_JOB,
  SYNC_ALL_GOOGLE_CALENDARS_EVERY_MS,
  SYNC_ALL_GOOGLE_CALENDARS_JOB,
  SYNC_ALL_GOOGLE_CALENDARS_SCHEDULER,
} from './google-calendar-sync-queue.constants';

@Injectable()
export class BullMqGoogleCalendarSyncJobQueue
  implements GoogleCalendarSyncJobQueue, OnModuleInit
{
  private readonly logger = new Logger(BullMqGoogleCalendarSyncJobQueue.name);

  constructor(
    @InjectQueue(GOOGLE_CALENDAR_SYNC_QUEUE)
    private readonly queue: Queue,
  ) {}

  onModuleInit(): void {
    this.queue
      .upsertJobScheduler(
        SYNC_ALL_GOOGLE_CALENDARS_SCHEDULER,
        { every: SYNC_ALL_GOOGLE_CALENDARS_EVERY_MS },
        {
          name: SYNC_ALL_GOOGLE_CALENDARS_JOB,
          opts: { removeOnComplete: true, removeOnFail: 100 },
        },
      )
      .catch((error: unknown) => {
        this.logger.warn(
          `Google Calendar sync scheduler was not registered: ${(error as Error).message}`,
        );
      });
  }

  async enqueue(syncId: string): Promise<void> {
    await this.queue.add(
      RUN_GOOGLE_CALENDAR_SYNC_JOB,
      { syncId },
      {
        jobId: `google-calendar-sync-${syncId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }
}
