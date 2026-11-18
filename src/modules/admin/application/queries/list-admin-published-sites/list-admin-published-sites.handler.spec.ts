import {
  AdminPublishedSiteStatusFilter,
  type AdminPublishedSiteReader,
} from '../../ports/admin-published-site-reader.port';
import { ListAdminPublishedSitesHandler } from './list-admin-published-sites.handler';
import { ListAdminPublishedSitesQuery } from './list-admin-published-sites.query';

function createHandler(total: number) {
  const listSites = jest.fn().mockResolvedValue({
    items: [],
    total,
    page: 1,
    limit: 10,
  });
  const reader = { listSites } as unknown as AdminPublishedSiteReader;

  return { handler: new ListAdminPublishedSitesHandler(reader), listSites };
}

describe('ListAdminPublishedSitesHandler', () => {
  it('passes search and status to the reader', async () => {
    const { handler, listSites } = createHandler(0);

    await handler.execute(
      new ListAdminPublishedSitesQuery(
        2,
        10,
        'docs',
        AdminPublishedSiteStatusFilter.DISABLED,
      ),
    );

    expect(listSites).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: 'docs',
      status: AdminPublishedSiteStatusFilter.DISABLED,
    });
  });

  it('lists every site when no status is given', async () => {
    const { handler, listSites } = createHandler(0);

    await handler.execute(new ListAdminPublishedSitesQuery(1, 20));

    expect(listSites).toHaveBeenCalledWith(
      expect.objectContaining({ status: AdminPublishedSiteStatusFilter.ALL }),
    );
  });

  it('computes total pages from the filtered total', async () => {
    const { handler } = createHandler(21);

    const result = await handler.execute(
      new ListAdminPublishedSitesQuery(1, 10),
    );

    expect(result.totalPages).toBe(3);
  });
});
