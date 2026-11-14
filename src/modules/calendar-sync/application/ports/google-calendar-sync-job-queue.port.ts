export interface GoogleCalendarSyncJobQueue {
  enqueue(syncId: string): Promise<void>;
}
