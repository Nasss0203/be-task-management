import { BadRequestException } from '@nestjs/common';

import type { AdminActionReader } from '../../ports/admin-action-reader.port';
import { ListAdminActionsHandler } from './list-admin-actions.handler';
import { ListAdminActionsQuery } from './list-admin-actions.query';

function createHandler(total = 0) {
  const listActions = jest.fn().mockResolvedValue({
    items: [],
    total,
    page: 1,
    limit: 20,
  });
  const reader = { listActions } as unknown as AdminActionReader;

  return { handler: new ListAdminActionsHandler(reader), listActions };
}

describe('ListAdminActionsHandler', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('defaults to the last 7 days and passes filters', async () => {
    const { handler, listActions } = createHandler(41);

    const result = await handler.execute(
      new ListAdminActionsQuery(1, 20, {
        action: 'USER_ROLE_CHANGED',
        targetType: 'USER',
        search: 'admin',
      }),
    );

    expect(listActions).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      from: new Date('2026-11-11T12:00:00.000Z'),
      to: new Date('2026-11-18T12:00:00.000Z'),
      action: 'USER_ROLE_CHANGED',
      targetType: 'USER',
      search: 'admin',
    });
    expect(result.totalPages).toBe(3);
  });

  it('rejects a range longer than 90 days', async () => {
    const { handler, listActions } = createHandler();

    await expect(
      handler.execute(
        new ListAdminActionsQuery(1, 20, {
          from: '2026-08-01T00:00:00.000Z',
          to: '2026-11-18T00:00:00.000Z',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(listActions).not.toHaveBeenCalled();
  });
});
