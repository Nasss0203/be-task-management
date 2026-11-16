import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bullmq';

import type {
  EnqueueGoogleCalendarSyncOptions,
  GoogleCalendarSyncJobQueue,
} from '../../application/ports/google-calendar-sync-job-queue.port';
import {
  GOOGLE_CALENDAR_SYNC_QUEUE,
  RUN_GOOGLE_CALENDAR_SYNC_JOB,
  SYNC_ALL_GOOGLE_CALENDARS_EVERY_MS,
  SYNC_ALL_GOOGLE_CALENDARS_JOB,
  SYNC_ALL_GOOGLE_CALENDARS_SCHEDULER,
  SYNC_ALL_GOOGLE_CALENDARS_SPREAD_MS,
} from './google-calendar-sync-queue.constants';

const RUN_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 30_000 },
  removeOnComplete: true,
  removeOnFail: true,
};

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

  async enqueue(
    syncId: string,
    options?: EnqueueGoogleCalendarSyncOptions,
  ): Promise<void> {
    const jobId = `google-calendar-sync-${syncId}`;

    if (options?.delayMs) {
      await this.queue.add(
        RUN_GOOGLE_CALENDAR_SYNC_JOB,
        { syncId },
        {
          ...RUN_JOB_OPTIONS,
          delay: options.delayMs,
          deduplication: { id: `${jobId}-change`, ttl: options.delayMs },
        },
      );
      return;
    }

    if (options?.scheduled) {
      await this.queue.add(
        RUN_GOOGLE_CALENDAR_SYNC_JOB,
        { syncId },
        {
          ...RUN_JOB_OPTIONS,
          jobId: `${jobId}-scheduled`,
          delay: Math.floor(
            Math.random() * SYNC_ALL_GOOGLE_CALENDARS_SPREAD_MS,
          ),
        },
      );
      return;
    }

    const running = await (await this.queue.getJob(jobId))?.isActive();

    await this.queue.add(
      RUN_GOOGLE_CALENDAR_SYNC_JOB,
      { syncId },
      { ...RUN_JOB_OPTIONS, jobId: running ? `${jobId}-rerun` : jobId },
    );
  }
}
