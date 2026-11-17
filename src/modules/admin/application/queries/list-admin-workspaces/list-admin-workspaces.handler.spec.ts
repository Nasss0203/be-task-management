import {
  AdminWorkspaceStatusFilter,
  type AdminWorkspaceReader,
} from '../../ports/admin-workspace-reader.port';
import { ListAdminWorkspacesHandler } from './list-admin-workspaces.handler';
import { ListAdminWorkspacesQuery } from './list-admin-workspaces.query';

function createHandler(total: number) {
  const listWorkspaces = jest.fn().mockResolvedValue({
    items: [],
    total,
    page: 1,
    limit: 10,
  });
  const reader = { listWorkspaces } as unknown as AdminWorkspaceReader;

  return { handler: new ListAdminWorkspacesHandler(reader), listWorkspaces };
}

describe('ListAdminWorkspacesHandler', () => {
  it('passes search and status filters to the reader', async () => {
    const { handler, listWorkspaces } = createHandler(0);

    await handler.execute(
      new ListAdminWorkspacesQuery(
        2,
        10,
        'owner@',
        AdminWorkspaceStatusFilter.TRASHED,
      ),
    );

    expect(listWorkspaces).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: 'owner@',
      status: AdminWorkspaceStatusFilter.TRASHED,
    });
  });

  it('lists only active workspaces when no status is given', async () => {
    const { handler, listWorkspaces } = createHandler(0);

    await handler.execute(new ListAdminWorkspacesQuery(1, 20));

    expect(listWorkspaces).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      status: AdminWorkspaceStatusFilter.ACTIVE,
    });
  });

  it('computes total pages from the filtered total', async () => {
    const { handler } = createHandler(21);

    const result = await handler.execute(
      new ListAdminWorkspacesQuery(
        1,
        10,
        undefined,
        AdminWorkspaceStatusFilter.ALL,
      ),
    );

    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(21);
  });
});
