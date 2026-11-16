export type EnqueueGoogleCalendarSyncOptions = {
  delayMs?: number;
};

export interface GoogleCalendarSyncJobQueue {
  enqueue(
    syncId: string,
    options?: EnqueueGoogleCalendarSyncOptions,
  ): Promise<void>;
}
