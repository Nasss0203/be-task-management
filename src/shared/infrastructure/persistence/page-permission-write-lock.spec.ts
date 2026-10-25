import type { EntityManager } from 'typeorm';
import { withPagePermissionWriteLock } from './page-permission-write-lock';

describe('withPagePermissionWriteLock', () => {
  it('retains the caller transaction and locks before writing', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const transactionMock = jest.fn();
    const manager = {
      queryRunner: { isTransactionActive: true },
      query,
      transaction: transactionMock,
    } as unknown as EntityManager;
    const write = jest.fn((context: EntityManager) => {
      expect(query).toHaveBeenCalledWith(
        'SELECT id FROM pages WHERE id = $1 FOR UPDATE',
        ['page-1'],
      );
      expect(context).toBe(manager);
      return Promise.resolve('saved');
    });
    await expect(
      withPagePermissionWriteLock(manager, 'page-1', write),
    ).resolves.toBe('saved');
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('wraps standalone writes and propagates failure to transaction rollback', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const transaction = {
      queryRunner: { isTransactionActive: true },
      query,
    } as unknown as EntityManager;
    const manager = {
      transaction: jest.fn(
        async (fn: (context: EntityManager) => Promise<unknown>) =>
          fn(transaction),
      ),
    } as unknown as EntityManager;
    const failure = new Error('write failed');
    await expect(
      withPagePermissionWriteLock(manager, 'page-1', () =>
        Promise.reject(failure),
      ),
    ).rejects.toBe(failure);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('never writes after a lock failure', async () => {
    const failure = new Error('lock timeout');
    const manager = {
      queryRunner: { isTransactionActive: true },
      query: jest.fn().mockRejectedValue(failure),
    } as unknown as EntityManager;
    const write = jest.fn();
    await expect(
      withPagePermissionWriteLock(manager, 'page-1', write),
    ).rejects.toBe(failure);
    expect(write).not.toHaveBeenCalled();
  });
});
