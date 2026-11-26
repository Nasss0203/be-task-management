import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

import type { AdminSessionReader } from '../../ports/admin-session-reader.port';
import { ListAdminSessionsHandler } from './list-admin-sessions.handler';
import { ListAdminSessionsQuery } from './list-admin-sessions.query';

function createHandler(total = 0) {
  const listSessions = jest.fn().mockResolvedValue({
    items: [],
    total,
    page: 1,
    limit: 20,
  });
  const reader = { listSessions } as unknown as AdminSessionReader;

  return { handler: new ListAdminSessionsHandler(reader), listSessions };
}

describe('ListAdminSessionsHandler', () => {
  it('passes search and system role to the reader', async () => {
    const { handler, listSessions } = createHandler();

    await handler.execute(
      new ListAdminSessionsQuery(
        2,
        50,
        'nam',
        SystemRole.SUPER_ADMIN,
        'user-1',
      ),
    );

    expect(listSessions).toHaveBeenCalledWith({
      page: 2,
      limit: 50,
      search: 'nam',
      systemRole: SystemRole.SUPER_ADMIN,
      userId: 'user-1',
    });
  });

  it('computes total pages from the filtered total', async () => {
    const { handler } = createHandler(41);

    const result = await handler.execute(new ListAdminSessionsQuery(1, 20));

    expect(result.totalPages).toBe(3);
  });
});
