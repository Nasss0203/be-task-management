import type { Queue } from 'bullmq';

jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => undefined,
}));

import { BullMqGoogleCalendarSyncJobQueue } from './bullmq-google-calendar-sync-job-queue.service';
import { RUN_GOOGLE_CALENDAR_SYNC_JOB } from './google-calendar-sync-queue.constants';

const createQueue = (
  existingJob: { isActive: () => Promise<boolean> } | undefined,
) => {
  const queue = {
    getJob: jest.fn().mockResolvedValue(existingJob),
    add: jest.fn().mockResolvedValue(undefined),
  };

  return {
    queue,
    jobQueue: new BullMqGoogleCalendarSyncJobQueue(queue as unknown as Queue),
  };
};

const addedJobId = (add: jest.Mock) =>
  (add.mock.calls[0] as [string, unknown, { jobId: string }])[2].jobId;

describe('BullMqGoogleCalendarSyncJobQueue', () => {
  it('adds the sync job when no job of that sync exists', async () => {
    const { queue, jobQueue } = createQueue(undefined);

    await jobQueue.enqueue('sync-1');

    expect(queue.getJob).toHaveBeenCalledWith('google-calendar-sync-sync-1');
    expect(queue.add).toHaveBeenCalledWith(
      RUN_GOOGLE_CALENDAR_SYNC_JOB,
      { syncId: 'sync-1' },
      expect.objectContaining({ jobId: 'google-calendar-sync-sync-1' }),
    );
  });

  it('keeps the same job id while that job only waits, so it is not queued twice', async () => {
    const { queue, jobQueue } = createQueue({
      isActive: () => Promise.resolve(false),
    });

    await jobQueue.enqueue('sync-1');

    expect(addedJobId(queue.add)).toBe('google-calendar-sync-sync-1');
  });

  it('queues one more run when the job of that sync is already running', async () => {
    const { queue, jobQueue } = createQueue({
      isActive: () => Promise.resolve(true),
    });

    await jobQueue.enqueue('sync-1');

    expect(addedJobId(queue.add)).toBe('google-calendar-sync-sync-1-rerun');
  });
});
