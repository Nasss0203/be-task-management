import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import type { Job } from 'bullmq';

import { RunGoogleCalendarSyncCommand } from '../../application/commands/run-google-calendar-sync/run-google-calendar-sync.command';
import { RunGoogleCalendarSyncHandler } from '../../application/commands/run-google-calendar-sync/run-google-calendar-sync.handler';
import type { GoogleCalendarSyncJobQueue } from '../../application/ports/google-calendar-sync-job-queue.port';
import { CALENDAR_SYNC_TYPES } from '../../calendar-sync.types';
import type { GoogleCalendarSyncRepository } from '../../domain/repositories/google-calendar-sync.repository';
import {
  GOOGLE_CALENDAR_SYNC_QUEUE,
  RUN_GOOGLE_CALENDAR_SYNC_JOB,
  SYNC_ALL_GOOGLE_CALENDARS_JOB,
} from './google-calendar-sync-queue.constants';

export type GoogleCalendarSyncJobData = {
  syncId?: string;
};

@Processor(GOOGLE_CALENDAR_SYNC_QUEUE)
export class GoogleCalendarSyncProcessor extends WorkerHost {
  constructor(
    @Inject(CALENDAR_SYNC_TYPES.applications.RunGoogleCalendarSyncHandler)
    private readonly runGoogleCalendarSyncHandler: RunGoogleCalendarSyncHandler,

    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarSyncRepository)
    private readonly syncRepository: GoogleCalendarSyncRepository,

    @Inject(CALENDAR_SYNC_TYPES.ports.GoogleCalendarSyncJobQueue)
    private readonly jobQueue: GoogleCalendarSyncJobQueue,
  ) {
    super();
  }

  async process(job: Job<GoogleCalendarSyncJobData>): Promise<void> {
    if (job.name === RUN_GOOGLE_CALENDAR_SYNC_JOB && job.data.syncId) {
      await this.runGoogleCalendarSyncHandler.execute(
        new RunGoogleCalendarSyncCommand(job.data.syncId),
      );
      return;
    }

    if (job.name === SYNC_ALL_GOOGLE_CALENDARS_JOB) {
      for (const syncId of await this.syncRepository.findIdsToSync()) {
        await this.jobQueue.enqueue(syncId, { scheduled: true });
      }
    }
  }
}
