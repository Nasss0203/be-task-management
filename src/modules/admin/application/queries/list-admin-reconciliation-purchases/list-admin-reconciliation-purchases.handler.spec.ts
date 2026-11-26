import type { AdminMarketplaceSalesReader } from '../../ports/admin-marketplace-sales-reader.port';
import { ListAdminReconciliationPurchasesHandler } from './list-admin-reconciliation-purchases.handler';
import { ListAdminReconciliationPurchasesQuery } from './list-admin-reconciliation-purchases.query';

describe('ListAdminReconciliationPurchasesHandler', () => {
  it('passes filters to the reader and computes total pages', async () => {
    const listReconciliationPurchases = jest.fn().mockResolvedValue({
      items: [],
      total: 21,
      page: 2,
      limit: 20,
    });
    const handler = new ListAdminReconciliationPurchasesHandler({
      listReconciliationPurchases,
    } as unknown as AdminMarketplaceSalesReader);

    const result = await handler.execute(
      new ListAdminReconciliationPurchasesQuery(2, 20, 'REFUNDED', 'TM-1'),
    );

    expect(listReconciliationPurchases).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      status: 'REFUNDED',
      search: 'TM-1',
    });
    expect(result.totalPages).toBe(2);
  });
});
