import type { GoogleCalendarSyncError } from '../google-calendar-sync-error';

export interface GoogleCalendarConnection {
  id: string;
  userId: string;
  googleEmail: string;
  refreshTokenEncrypted: string;
  lastError: GoogleCalendarSyncError | null;
}

export interface GoogleCalendarConnectionRepository {
  findById(id: string): Promise<GoogleCalendarConnection | null>;
  findByUserId(userId: string): Promise<GoogleCalendarConnection | null>;
  save(connection: GoogleCalendarConnection): Promise<void>;
  markError(id: string, error: GoogleCalendarSyncError | null): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
