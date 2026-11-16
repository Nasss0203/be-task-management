import {
  DatabaseRowsChangedListener,
  ROW_CHANGE_SYNC_DELAY_MS,
} from './database-rows-changed.listener';

describe('DatabaseRowsChangedListener', () => {
  const syncRepository = { findIdsByDatabaseId: jest.fn() };
  const jobQueue = { enqueue: jest.fn() };
  const listener = new DatabaseRowsChangedListener(
    syncRepository as never,
    jobQueue as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jobQueue.enqueue.mockResolvedValue(undefined);
  });

  it('queues a delayed run for every sync of the changed database', async () => {
    syncRepository.findIdsByDatabaseId.mockResolvedValue(['sync-a', 'sync-b']);

    await listener.handle({ databaseId: 'db' });

    expect(syncRepository.findIdsByDatabaseId).toHaveBeenCalledWith('db');
    expect(jobQueue.enqueue).toHaveBeenCalledTimes(2);
    expect(jobQueue.enqueue).toHaveBeenCalledWith('sync-a', {
      delayMs: ROW_CHANGE_SYNC_DELAY_MS,
    });
    expect(jobQueue.enqueue).toHaveBeenCalledWith('sync-b', {
      delayMs: ROW_CHANGE_SYNC_DELAY_MS,
    });
  });

  it('queues nothing when the database has no sync', async () => {
    syncRepository.findIdsByDatabaseId.mockResolvedValue([]);

    await listener.handle({ databaseId: 'db' });

    expect(jobQueue.enqueue).not.toHaveBeenCalled();
  });

  it('swallows queue failures so the row edit is not affected', async () => {
    syncRepository.findIdsByDatabaseId.mockResolvedValue(['sync-a']);
    jobQueue.enqueue.mockRejectedValue(new Error('redis down'));

    await expect(listener.handle({ databaseId: 'db' })).resolves.toBe(
      undefined,
    );
  });
});
