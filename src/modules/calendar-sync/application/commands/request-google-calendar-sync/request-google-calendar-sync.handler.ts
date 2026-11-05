import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CALENDAR_SYNC_TYPES } from '../../../calendar-sync.types';
import type { GoogleCalendarConnectionRepository } from '../../../domain/repositories/google-calendar-connection.repository';
import type { GoogleCalendarSyncRepository } from '../../../domain/repositories/google-calendar-sync.repository';
import type { GoogleCalendarSyncJobQueue } from '../../ports/google-calendar-sync-job-queue.port';
import { RequestGoogleCalendarSyncCommand } from './request-google-calendar-sync.command';

@Injectable()
export class RequestGoogleCalendarSyncHandler {
  constructor(
    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarConnectionRepository)
    private readonly connectionRepository: GoogleCalendarConnectionRepository,

    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarSyncRepository)
    private readonly syncRepository: GoogleCalendarSyncRepository,

    @Inject(CALENDAR_SYNC_TYPES.ports.GoogleCalendarSyncJobQueue)
    private readonly jobQueue: GoogleCalendarSyncJobQueue,
  ) {}

  async execute(command: RequestGoogleCalendarSyncCommand): Promise<void> {
    const connection = await this.connectionRepository.findByUserId(
      command.userId,
    );
    const sync = connection
      ? await this.syncRepository.findByConnectionAndDatabase(
          connection.id,
          command.databaseId,
        )
      : null;

    if (!sync) {
      throw new NotFoundException('Google Calendar sync not found');
    }

    await this.jobQueue.enqueue(sync.id);
  }
}
