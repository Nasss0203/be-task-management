import { Inject, Injectable } from '@nestjs/common';

import { CALENDAR_SYNC_TYPES } from '../../../calendar-sync.types';
import type { GoogleCalendarSyncError } from '../../../domain/google-calendar-sync-error';
import type {
  GoogleCalendarConnection,
  GoogleCalendarConnectionRepository,
} from '../../../domain/repositories/google-calendar-connection.repository';
import type {
  GoogleCalendarSync,
  GoogleCalendarSyncRepository,
} from '../../../domain/repositories/google-calendar-sync.repository';
import { GetGoogleCalendarSyncQuery } from './get-google-calendar-sync.query';

export type GoogleCalendarSyncStatus = {
  connected: boolean;
  googleEmail: string | null;
  connectionError: GoogleCalendarSyncError | null;
  sync: {
    datePropertyId: string;
    assignedToMeOnly: boolean;
    lastSyncedAt: Date | null;
    lastError: GoogleCalendarSyncError | null;
  } | null;
};

export const toGoogleCalendarSyncStatus = (
  connection: GoogleCalendarConnection | null,
  sync: GoogleCalendarSync | null,
): GoogleCalendarSyncStatus => ({
  connected: connection !== null,
  googleEmail: connection?.googleEmail ?? null,
  connectionError: connection?.lastError ?? null,
  sync: sync
    ? {
        datePropertyId: sync.datePropertyId,
        assignedToMeOnly: sync.assignedToMeOnly,
        lastSyncedAt: sync.lastSyncedAt,
        lastError: sync.lastError,
      }
    : null,
});

@Injectable()
export class GetGoogleCalendarSyncHandler {
  constructor(
    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarConnectionRepository)
    private readonly connectionRepository: GoogleCalendarConnectionRepository,

    @Inject(CALENDAR_SYNC_TYPES.repositories.GoogleCalendarSyncRepository)
    private readonly syncRepository: GoogleCalendarSyncRepository,
  ) {}

  async execute(
    query: GetGoogleCalendarSyncQuery,
  ): Promise<GoogleCalendarSyncStatus> {
    const connection = await this.connectionRepository.findByUserId(
      query.userId,
    );

    const sync = connection
      ? await this.syncRepository.findByConnectionAndDatabase(
          connection.id,
          query.databaseId,
        )
      : null;

    return toGoogleCalendarSyncStatus(connection, sync);
  }
}
