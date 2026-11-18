import type { DataSource } from 'typeorm';

import { TypeOrmAdminActionRecorder } from './typeorm-admin-action.recorder';

const entry = {
  actor: { userId: 'admin-1', ipAddress: '::1', userAgent: 'x'.repeat(300) },
  action: 'MARKETPLACE_COMMISSION_UPDATED' as const,
  targetType: 'MARKETPLACE_COMMISSION' as const,
  targetId: null,
  changes: { rateBps: { to: 1500 } },
};

describe('TypeOrmAdminActionRecorder', () => {
  it('stores the entry with a truncated user agent', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const recorder = new TypeOrmAdminActionRecorder({
      query,
    } as unknown as DataSource);

    await recorder.record(entry);

    const [, parameters] = query.mock.calls[0] as [string, unknown[]];
    expect(parameters).toEqual([
      'admin-1',
      'MARKETPLACE_COMMISSION_UPDATED',
      'MARKETPLACE_COMMISSION',
      null,
      JSON.stringify({ rateBps: { to: 1500 } }),
      '::1',
      'x'.repeat(255),
    ]);
  });

  it('does not throw when the insert fails', async () => {
    const query = jest.fn().mockRejectedValue(new Error('db down'));
    const recorder = new TypeOrmAdminActionRecorder({
      query,
    } as unknown as DataSource);

    await expect(recorder.record(entry)).resolves.toBeUndefined();
  });
});
