import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import type { AdminUserReader } from '../../ports/admin-user-reader.port';
import { ListAdminUsersHandler } from './list-admin-users.handler';
import { ListAdminUsersQuery } from './list-admin-users.query';

function createHandler(total: number) {
  const listUsers = jest.fn().mockResolvedValue({
    items: [],
    total,
    page: 1,
    limit: 10,
  });
  const reader = { listUsers } as unknown as AdminUserReader;

  return { handler: new ListAdminUsersHandler(reader), listUsers };
}

describe('ListAdminUsersHandler', () => {
  it('passes status, role and search filters to the reader', async () => {
    const { handler, listUsers } = createHandler(0);

    await handler.execute(
      new ListAdminUsersQuery(2, 10, 'qa', false, SystemRole.SUPER_ADMIN),
    );

    expect(listUsers).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: 'qa',
      isActive: false,
      systemRole: SystemRole.SUPER_ADMIN,
    });
  });

  it('leaves filters undefined when none are given', async () => {
    const { handler, listUsers } = createHandler(0);

    await handler.execute(new ListAdminUsersQuery(1, 20));

    expect(listUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      isActive: undefined,
      systemRole: undefined,
    });
  });

  it('computes total pages from the filtered total', async () => {
    const { handler } = createHandler(21);

    const result = await handler.execute(
      new ListAdminUsersQuery(1, 10, undefined, true),
    );

    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(21);
  });
});
