export type EnqueueGoogleCalendarSyncOptions = {
  delayMs?: number;
  scheduled?: boolean;
};

export interface GoogleCalendarSyncJobQueue {
  enqueue(
    syncId: string,
    options?: EnqueueGoogleCalendarSyncOptions,
  ): Promise<void>;
}
