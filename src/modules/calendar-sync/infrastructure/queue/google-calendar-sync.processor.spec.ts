jest.mock('@nestjs/bullmq', () => ({
  Processor: () => () => undefined,
  WorkerHost: class {},
}));

import { GoogleCalendarSyncProcessor } from './google-calendar-sync.processor';
import { SYNC_ALL_GOOGLE_CALENDARS_JOB } from './google-calendar-sync-queue.constants';

describe('GoogleCalendarSyncProcessor', () => {
  it('queues every sync as a scheduled run so they do not all start at once', async () => {
    const syncRepository = {
      findIdsToSync: jest.fn(() => Promise.resolve(['sync-1', 'sync-2'])),
    };
    const jobQueue = { enqueue: jest.fn(() => Promise.resolve()) };
    const processor = new GoogleCalendarSyncProcessor(
      {} as never,
      syncRepository as never,
      jobQueue as never,
    );

    await processor.process({
      name: SYNC_ALL_GOOGLE_CALENDARS_JOB,
      data: {},
    } as never);

    expect(jobQueue.enqueue.mock.calls).toEqual([
      ['sync-1', { scheduled: true }],
      ['sync-2', { scheduled: true }],
    ]);
  });
});
