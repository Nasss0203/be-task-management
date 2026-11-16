import type { GoogleCalendarSyncError } from '../google-calendar-sync-error';

export interface GoogleCalendarSync {
  id: string;
  connectionId: string;
  databaseId: string;
  datePropertyId: string;
  assignedToMeOnly: boolean;
  googleCalendarId: string;
  lastSyncedAt: Date | null;
  lastError: GoogleCalendarSyncError | null;
}

export interface GoogleCalendarSyncRepository {
  findById(id: string): Promise<GoogleCalendarSync | null>;
  findByConnectionAndDatabase(
    connectionId: string,
    databaseId: string,
  ): Promise<GoogleCalendarSync | null>;
  findByConnectionId(connectionId: string): Promise<GoogleCalendarSync[]>;
  findIdsToSync(): Promise<string[]>;
  findIdsByDatabaseId(databaseId: string): Promise<string[]>;
  save(sync: GoogleCalendarSync): Promise<void>;
  markSynced(id: string, syncedAt: Date): Promise<void>;
  markFailed(id: string, error: GoogleCalendarSyncError): Promise<void>;
  delete(id: string): Promise<void>;
}
