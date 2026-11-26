import { NotFoundException } from '@nestjs/common';

import type { AdminSessionReader } from '../../ports/admin-session-reader.port';
import { ListAdminLoginAttemptsHandler } from './list-admin-login-attempts.handler';
import { ListAdminLoginAttemptsQuery } from './list-admin-login-attempts.query';

function createHandler(result: unknown) {
  const listLoginAttempts = jest.fn().mockResolvedValue(result);
  const reader = { listLoginAttempts } as unknown as AdminSessionReader;

  return {
    handler: new ListAdminLoginAttemptsHandler(reader),
    listLoginAttempts,
  };
}

describe('ListAdminLoginAttemptsHandler', () => {
  const since = new Date('2026-08-21T00:00:00.000Z');

  it('passes filters to the reader and computes total pages', async () => {
    const { handler, listLoginAttempts } = createHandler({
      items: [],
      total: 41,
      page: 1,
      limit: 20,
      since,
    });

    const result = await handler.execute(
      new ListAdminLoginAttemptsQuery(
        1,
        20,
        'FAILED',
        'PASSWORD',
        '203.0',
        'user-1',
      ),
    );

    expect(listLoginAttempts).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      result: 'FAILED',
      method: 'PASSWORD',
      search: '203.0',
      userId: 'user-1',
    });
    expect(result.totalPages).toBe(3);
    expect(result.since).toBe(since);
  });

  it('throws not found when the user does not exist', async () => {
    const { handler } = createHandler(null);

    await expect(
      handler.execute(
        new ListAdminLoginAttemptsQuery(
          1,
          20,
          undefined,
          undefined,
          undefined,
          'missing',
        ),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
