import { NotFoundException } from '@nestjs/common';

import type { AdminSessionReader } from '../../ports/admin-session-reader.port';
import { GetAdminUserIpHistoryHandler } from './get-admin-user-ip-history.handler';
import { GetAdminUserIpHistoryQuery } from './get-admin-user-ip-history.query';

function createHandler(history: unknown) {
  const getUserIpHistory = jest.fn().mockResolvedValue(history);
  const reader = { getUserIpHistory } as unknown as AdminSessionReader;

  return {
    handler: new GetAdminUserIpHistoryHandler(reader),
    getUserIpHistory,
  };
}

describe('GetAdminUserIpHistoryHandler', () => {
  it('returns the history of the user', async () => {
    const history = { userId: 'user-1', since: new Date(), items: [] };
    const { handler, getUserIpHistory } = createHandler(history);

    await expect(
      handler.execute(new GetAdminUserIpHistoryQuery('user-1')),
    ).resolves.toBe(history);
    expect(getUserIpHistory).toHaveBeenCalledWith('user-1');
  });

  it('maps a missing user to 404', async () => {
    const { handler } = createHandler(null);

    await expect(
      handler.execute(new GetAdminUserIpHistoryQuery('missing')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
